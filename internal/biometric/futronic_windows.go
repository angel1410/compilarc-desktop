//go:build windows

package biometric

import (
	"encoding/base64"
	"fmt"
	"math"
	"os/exec"
	"syscall"
	"time"
	"unsafe"
)

type FTRSCAN_IMAGE_SIZE struct {
	NWidth     int32
	NHeight    int32
	NImageSize int32
}

var (
	modFtrScanAPI = syscall.NewLazyDLL("ftrScanAPI.dll")

	procFtrScanOpenDevice            = modFtrScanAPI.NewProc("ftrScanOpenDevice")
	procFtrScanOpenDeviceOnInterface = modFtrScanAPI.NewProc("ftrScanOpenDeviceOnInterface")
	procFtrScanCloseDevice           = modFtrScanAPI.NewProc("ftrScanCloseDevice")
	procFtrScanGetImageSize          = modFtrScanAPI.NewProc("ftrScanGetImageSize")
	procFtrScanGetFrame              = modFtrScanAPI.NewProc("ftrScanGetFrame")
	procFtrScanIsFingerPresent       = modFtrScanAPI.NewProc("ftrScanIsFingerPresent")
	procFtrScanSetDiodesStatus       = modFtrScanAPI.NewProc("ftrScanSetDiodesStatus")
	procFtrScanGetLastError          = modFtrScanAPI.NewProc("ftrScanGetLastError")
	procFtrSetBaseInterface          = modFtrScanAPI.NewProc("ftrSetBaseInterface")
	procFtrScanGetInterfaces         = modFtrScanAPI.NewProc("ftrScanGetInterfaces")
)

// CapturarDesdeHardware interactúa directamente con el driver oficial ftrScanAPI.dll en Windows
// Implementa captura inteligente multiframe con estabilización de pulpejo y evaluación óptica de presión.
func CapturarDesdeHardware() ([]byte, int, int, string, int, error) {
	// 1. Probar carga de la DLL oficial
	if err := modFtrScanAPI.Load(); err != nil {
		return nil, 0, 0, "", 0, fmt.Errorf("no se encontró 'ftrScanAPI.dll'. Instale el driver de Futronic o copie la DLL a C:\\CompilaRC (Detalle: %w)", err)
	}

	// Liberar posible bloqueo exclusivo de Windows Biometric Service
	cmdBio := exec.Command("net", "stop", "WbioSrvc")
	cmdBio.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	_ = cmdBio.Run()

	// 2. Abrir dispositivo USB probando todas las bases (USB 2.0 e interfaces)
	var hDev uintptr

	// Probar primero ftrScanOpenDevice directo
	if h, _, _ := procFtrScanOpenDevice.Call(); h != 0 {
		hDev = h
	}

	// Si no abrió directo, iterar sobre los modos USB de Futronic:
	// 1 = FTR_DEVICE_USB_2_0_TYPE_1 (FS88H / FS80H USB 2.0)
	// 4 = FTR_DEVICE_USB_2_0_TYPE_2
	// 0 = FTR_DEVICE_USB_1_1
	// 5 = FTR_DEVICE_USB_2_0_TYPE_3
	// 6 = FTR_DEVICE_USB_2_0_TYPE_4
	if hDev == 0 {
		basesUSB := []int{1, 4, 0, 5, 6}
		for _, base := range basesUSB {
			if procFtrSetBaseInterface.Find() == nil {
				procFtrSetBaseInterface.Call(uintptr(base))
			}

			// Probar apertura directa con la base asignada
			if h, _, _ := procFtrScanOpenDevice.Call(); h != 0 {
				hDev = h
				break
			}

			// Probar detección de interfaces en esta base
			if procFtrScanGetInterfaces.Find() == nil && procFtrScanOpenDeviceOnInterface.Find() == nil {
				var statusList [128]int32
				if r, _, _ := procFtrScanGetInterfaces.Call(uintptr(unsafe.Pointer(&statusList[0]))); r != 0 {
					for iface := 0; iface < 128; iface++ {
						if statusList[iface] == 0 { // FTRSCAN_INTERFACE_STATUS_CONNECTED
							if h, _, _ := procFtrScanOpenDeviceOnInterface.Call(uintptr(iface)); h != 0 {
								hDev = h
								break
							}
						}
					}
				}
			}

			if hDev != 0 {
				break
			}

			// Probar interfaces directas 0..3
			if procFtrScanOpenDeviceOnInterface.Find() == nil {
				for iface := 0; iface < 4; iface++ {
					if h, _, _ := procFtrScanOpenDeviceOnInterface.Call(uintptr(iface)); h != 0 {
						hDev = h
						break
					}
				}
			}
			if hDev != 0 {
				break
			}
		}
	}

	if hDev == 0 {
		var errCode uintptr
		if procFtrScanGetLastError.Find() == nil {
			errCode, _, _ = procFtrScanGetLastError.Call()
		}
		detalle := ""
		switch errCode {
		case 5:
			detalle = " [Error 5: Acceso denegado. Ejecute CompilaRC como Administrador]"
		case 21:
			detalle = " [Error 21: Dispositivo no listo. Verifique el driver en Administrador de Dispositivos]"
		case 259:
			detalle = " [Error 259: No hay sensor conectado en los puertos USB]"
		case 0x20000004:
			detalle = " [Hardware incompatible con el controlador]"
		default:
			if errCode != 0 {
				detalle = fmt.Sprintf(" [Código Futronic: %d / 0x%X]", errCode, errCode)
			}
		}
		return nil, 0, 0, "", 0, fmt.Errorf("sensor Futronic FS88H no detectado%s. Verifique que el cable USB esté conectado y reconocido en el Administrador de Dispositivos (devmgmt.msc)", detalle)
	}
	defer procFtrScanCloseDevice.Call(hDev)

	// 3. Obtener dimensiones de imagen del sensor
	var imgSize FTRSCAN_IMAGE_SIZE
	rSize, _, _ := procFtrScanGetImageSize.Call(hDev, uintptr(unsafe.Pointer(&imgSize)))
	if rSize == 0 || imgSize.NImageSize <= 0 {
		return nil, 0, 0, "", 0, fmt.Errorf("falla al consultar resolución óptica del sensor Futronic")
	}

	w := int(imgSize.NWidth)
	h := int(imgSize.NHeight)
	if w <= 0 || h <= 0 {
		w = 320
		h = 480
	}

	// 4. Encender diodo LED verde para solicitar el dedo (255=verde encendido, 0=rojo apagado)
	procFtrScanSetDiodesStatus.Call(hDev, 255, 0)
	defer procFtrScanSetDiodesStatus.Call(hDev, 0, 0)

	// 5. Esperar hasta 10 segundos a que el operador o ciudadano coloque el dedo en el cristal
	inicio := time.Now()
	var finalFrame []byte
	finalCalidad := 0

	for time.Since(inicio) < 10*time.Second {
		// Verificar si el dedo está presente en el cristal
		rPresent, _, _ := procFtrScanIsFingerPresent.Call(hDev, 0)
		if rPresent != 0 {
			// El dedo hizo contacto inicial. Realizar muestreo multiframe continuo (streaming)
			// mientras el ciudadano asienta el pulpejo y estabiliza la presión en el prisma.
			tempFrame := make([]byte, imgSize.NImageSize)
			var bestFrame []byte
			bestScore := -1.0
			bestCalidad := 0
			stableStreak := 0
			lastRidgeCount := 0

			tContacto := time.Now()
			// Muestrear hasta 2.5 segundos mientras mantenga el dedo apoyado
			for time.Since(tContacto) < 2500*time.Millisecond {
				rFrame, _, _ := procFtrScanGetFrame.Call(
					hDev,
					uintptr(unsafe.Pointer(&tempFrame[0])),
					0,
				)
				if rFrame == 0 {
					break
				}

				// Invertir a formato estándar CNE (fondo blanco 255, crestas oscuras 0)
				inverted := make([]byte, len(tempFrame))
				for i, v := range tempFrame {
					inverted[i] = 255 - v
				}

				// Medir calidad de contacto y presión del pulpejo
				calidadFrame, ridgeCount, deepCount, contrast := evaluarCalidadOpticaFrame(inverted)
				scoreFrame := float64(ridgeCount)*0.5 + float64(deepCount)*1.5 + contrast*30.0

				if scoreFrame > bestScore {
					bestScore = scoreFrame
					bestFrame = inverted
					bestCalidad = calidadFrame
				}

				// Condición de captura óptima: excelente superficie y presión profunda
				// que se mantengan estables en 2 cuadros sucesivos
				if ridgeCount >= 16000 && deepCount >= 5000 {
					diff := ridgeCount - lastRidgeCount
					if diff < 0 {
						diff = -diff
					}
					if diff < 1500 {
						stableStreak++
						if stableStreak >= 2 {
							bestFrame = inverted
							bestCalidad = calidadFrame
							break
						}
					} else {
						stableStreak = 0
					}
				}
				lastRidgeCount = ridgeCount
				time.Sleep(75 * time.Millisecond)
			}

			if len(bestFrame) > 0 {
				finalFrame = bestFrame
				finalCalidad = bestCalidad
				break
			}
		}
		time.Sleep(80 * time.Millisecond)
	}

	if len(finalFrame) == 0 {
		return nil, 0, 0, "", 0, fmt.Errorf("tiempo de espera agotado: no se colocó el dedo sobre el cristal del sensor Futronic FS88H")
	}

	// 6. Validar que la muestra final tenga presión y superficie suficiente
	if finalCalidad < 40 {
		return nil, 0, 0, "", 0, fmt.Errorf("presión insuficiente: se detectó poco contacto sobre el cristal del lector. Por favor apoye con mayor firmeza el pulpejo del dedo en el centro del prisma y manténgalo inmóvil un momento")
	}

	// 7. Convertir buffer final (ya invertido con fondo blanco oficial CNE) a BMP real en memoria
	bmpBytes := RawToBMP(w, h, finalFrame)
	b64BMP := "data:image/bmp;base64," + base64.StdEncoding.EncodeToString(bmpBytes)

	return finalFrame, w, h, b64BMP, finalCalidad, nil
}

// evaluarCalidadOpticaFrame calcula la nitidez y cobertura del pulpejo (0 a 100)
func evaluarCalidadOpticaFrame(inverted []byte) (calidad int, ridgeCount int, deepCount int, contrast float64) {
	total := len(inverted)
	if total == 0 {
		return 0, 0, 0, 0
	}

	sumActive := 0.0
	for _, p := range inverted {
		if p < 150 { // Crestas papilares visibles
			ridgeCount++
			sumActive += float64(p)
			if p < 80 { // Crestas con contacto firme y profundo
				deepCount++
			}
		}
	}

	if ridgeCount > 100 {
		meanActive := sumActive / float64(ridgeCount)
		varSq := 0.0
		for _, p := range inverted {
			if p < 150 {
				d := float64(p) - meanActive
				varSq += d * d
			}
		}
		contrast = math.Sqrt(varSq / float64(ridgeCount))
	}

	// Puntaje 0 a 100 basado en pulpejo y firmeza de contacto:
	// - Cobertura adecuada (ridgeCount >= 25,000): 50 pts
	// - Crestas profundas (deepCount >= 10,000): 50 pts
	scoreArea := math.Min(50.0, (float64(ridgeCount)/25000.0)*50.0)
	scorePres := math.Min(50.0, (float64(deepCount)/10000.0)*50.0)

	calidad = int(scoreArea + scorePres)
	if calidad > 99 {
		calidad = 99
	}
	if calidad < 0 {
		calidad = 0
	}
	return calidad, ridgeCount, deepCount, contrast
}

// VerificarConexionHardware comprueba de manera no invasiva si el sensor Futronic FS88H está conectado por USB
func VerificarConexionHardware() bool {
	if err := modFtrScanAPI.Load(); err != nil {
		return false
	}
	if h, _, _ := procFtrScanOpenDevice.Call(); h != 0 {
		procFtrScanCloseDevice.Call(h)
		return true
	}
	basesUSB := []int{1, 4, 0, 5, 6}
	for _, b := range basesUSB {
		if procFtrSetBaseInterface.Find() == nil {
			procFtrSetBaseInterface.Call(uintptr(b))
		}
		if h, _, _ := procFtrScanOpenDevice.Call(); h != 0 {
			procFtrScanCloseDevice.Call(h)
			return true
		}
		if procFtrScanOpenDeviceOnInterface.Find() == nil {
			for iface := 0; iface < 4; iface++ {
				if h, _, _ := procFtrScanOpenDeviceOnInterface.Call(uintptr(iface)); h != 0 {
					procFtrScanCloseDevice.Call(h)
					return true
				}
			}
		}
	}
	return false
}
