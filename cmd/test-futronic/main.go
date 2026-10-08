//go:build windows

package main

import (
	"fmt"
	"os"
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

func main() {
	fmt.Println("==================================================")
	fmt.Println("TEST DE DIAGNOSTICO DE HARDWARE FUTRONIC FS88H")
	fmt.Println("Consejo Nacional Electoral (CNE) - CompilaRC")
	fmt.Println("==================================================")

	_, errAdmin := os.Open(`\\.\PHYSICALDRIVE0`)
	if errAdmin == nil {
		fmt.Println("[PRIVILEGIOS] Administrador: SI (Modo Elevado)")
	} else {
		fmt.Println("[PRIVILEGIOS] Administrador: NO (Usuario estándar)")
		fmt.Println("             AVISO: Se recomienda 'Ejecutar como Administrador'.")
	}

	// Liberar bloqueo exclusivo de Windows Biometric Service
	fmt.Println("[SISTEMA] Liberando sensor de Windows Biometric Service (WbioSrvc)...")
	_ = exec.Command("net", "stop", "WbioSrvc").Run()

	dll := syscall.NewLazyDLL("ftrScanAPI.dll")
	if err := dll.Load(); err != nil {
		fmt.Printf("[ERROR] No se pudo cargar ftrScanAPI.dll: %v\n", err)
		fmt.Println("Asegurese de que ftrScanAPI.dll este en esta misma carpeta o en C:\\Windows\\System32")
		esperarSalir()
		return
	}
	fmt.Println("[OK] ftrScanAPI.dll cargada correctamente en memoria.")

	procOpen := dll.NewProc("ftrScanOpenDevice")
	procOpenIface := dll.NewProc("ftrScanOpenDeviceOnInterface")
	procClose := dll.NewProc("ftrScanCloseDevice")
	procGetSize := dll.NewProc("ftrScanGetImageSize")
	procGetFrame := dll.NewProc("ftrScanGetFrame")
	procIsFinger := dll.NewProc("ftrScanIsFingerPresent")
	procSetDiodes := dll.NewProc("ftrScanSetDiodesStatus")
	procGetLastErr := dll.NewProc("ftrScanGetLastError")
	procSetBase := dll.NewProc("ftrSetBaseInterface")
	procGetIfaces := dll.NewProc("ftrScanGetInterfaces")

	var hDev uintptr
	// Probar apertura directa
	h, _, _ := procOpen.Call()
	if h != 0 {
		hDev = h
		fmt.Println("[OK] Dispositivo abierto exitosamente con ftrScanOpenDevice() directo!")
	} else {
		fmt.Println("[INFO] ftrScanOpenDevice() directo retorno 0. Probando modos USB 2.0 e interfaces...")
		bases := []struct {
			id   int
			desc string
		}{
			{1, "USB 2.0 Tipo 1 (FS88H / FS80H)"},
			{4, "USB 2.0 Tipo 2"},
			{0, "USB 1.1"},
			{5, "USB 2.0 Tipo 3"},
			{6, "USB 2.0 Tipo 4"},
		}

		for _, b := range bases {
			fmt.Printf(" -> Probando Base %d: %s...\n", b.id, b.desc)
			if procSetBase.Find() == nil {
				procSetBase.Call(uintptr(b.id))
			}

			if h, _, sysErr := procOpen.Call(); h != 0 {
				hDev = h
				fmt.Printf("[OK] Conectado exitosamente en Base %d (%s)!\n", b.id, b.desc)
				break
			} else {
				var lastErr uintptr
				if procGetLastErr.Find() == nil {
					lastErr, _, _ = procGetLastErr.Call()
				}
				fmt.Printf("    -> ftrScanOpenDevice fallo: sysErr='%v', ftrErr=%d (0x%X)\n", sysErr, lastErr, lastErr)
			}

			if procGetIfaces.Find() == nil && procOpenIface.Find() == nil {
				var status [128]int32
				if r, _, sysErr := procGetIfaces.Call(uintptr(unsafe.Pointer(&status[0]))); r != 0 {
					for iface := 0; iface < 128; iface++ {
						if status[iface] == 0 {
							fmt.Printf("    -> Interfaz %d conectada! Intentando abrir...\n", iface)
							hi, _, sysErrOpen := procOpenIface.Call(uintptr(iface))
							var lastErr uintptr
							if procGetLastErr.Find() == nil {
								lastErr, _, _ = procGetLastErr.Call()
							}
							if hi != 0 {
								hDev = hi
								fmt.Printf("[OK] Conectado en interfaz %d!\n", iface)
								break
							} else {
								fmt.Printf("    -> Fallo al abrir interfaz %d: sysErr='%v', ftrErr=%d (0x%X)\n", iface, sysErrOpen, lastErr, lastErr)
							}
						}
					}
				} else {
					fmt.Printf("    -> ftrScanGetInterfaces retorno 0: sysErr='%v'\n", sysErr)
				}
			}
			if hDev != 0 {
				break
			}
		}
	}

	if hDev == 0 {
		var lastErr uintptr
		if procGetLastErr.Find() == nil {
			lastErr, _, _ = procGetLastErr.Call()
		}
		fmt.Printf("\n[FALLO] No se pudo abrir el sensor Futronic. Codigo de error: %d (0x%X)\n", lastErr, lastErr)
		switch lastErr {
		case 5:
			fmt.Println("CAUSA: Error 5 (Acceso denegado). Ejecute este programa como Administrador (clic derecho > Ejecutar como Administrador).")
		case 21:
			fmt.Println("CAUSA: Error 21 (ERROR_NOT_READY). El dispositivo esta suspendido o no responde.")
		case 259:
			fmt.Println("CAUSA: Error 259 (ERROR_NO_MORE_ITEMS). No hay ningun sensor Futronic reconocido en el bus USB.")
		}
		esperarSalir()
		return
	}
	defer procClose.Call(hDev)

	var imgSize FTRSCAN_IMAGE_SIZE
	rSize, _, _ := procGetSize.Call(hDev, uintptr(unsafe.Pointer(&imgSize)))
	if rSize == 0 || imgSize.NImageSize <= 0 {
		fmt.Println("[ERROR] No se pudo obtener la resolucion de la imagen del sensor.")
		esperarSalir()
		return
	}
	fmt.Printf("[OK] Sensor listo. Resolucion: %dx%d pixeles (%d bytes a 500 DPI)\n", imgSize.NWidth, imgSize.NHeight, imgSize.NImageSize)

	fmt.Println("\nEncendiendo LED verde del lector...")
	procSetDiodes.Call(hDev, 255, 0)
	defer procSetDiodes.Call(hDev, 0, 0)

	fmt.Println(">>> POR FAVOR COLOQUE EL DEDO SOBRE EL CRISTAL DEL SENSOR (8 segundos)... <<<")

	frameBuffer := make([]byte, imgSize.NImageSize)
	inicio := time.Now()
	capturado := false

	for time.Since(inicio) < 8*time.Second {
		rPresent, _, _ := procIsFinger.Call(hDev, 0)
		if rPresent != 0 {
			fmt.Println("[DETECTADO] Dedo presente en el cristal! Capturando huella...")
			rFrame, _, _ := procGetFrame.Call(hDev, uintptr(unsafe.Pointer(&frameBuffer[0])), 0)
			if rFrame != 0 {
				capturado = true
				break
			}
		}
		time.Sleep(100 * time.Millisecond)
	}

	if !capturado {
		fmt.Println("[TIMEOUT] Tiempo agotado. No se detecto el dedo.")
		esperarSalir()
		return
	}

	fmt.Println("\n**************************************************")
	fmt.Println("¡HUELLA CAPTURADA EXITOSAMENTE DESDE EL HARDWARE!")
	fmt.Printf("Muestra obtenida: %d bytes de imagen real a 500 DPI.\n", len(frameBuffer))
	fmt.Println("**************************************************")
	esperarSalir()
}

func esperarSalir() {
	fmt.Println("\nPresione ENTER para salir...")
	var b [1]byte
	os.Stdin.Read(b[:])
}
