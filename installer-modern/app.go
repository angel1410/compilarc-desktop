package main

import (
	"context"
	_ "embed"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed payload/compilarc-desktop.exe
var payloadExe []byte

//go:embed payload/ftrScanAPI.dll
var payloadFtrScanAPI []byte

//go:embed payload/appicon.ico
var payloadIcon []byte

//go:embed payload/data/ac_local.db
var payloadAC []byte

//go:embed payload/data/solicitudes_offline.db
var payloadPackets []byte

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// ObtenerRutaDefecto retorna la ruta estándar de instalación en Windows
func (a *App) ObtenerRutaDefecto() string {
	if runtime.GOOS == "windows" {
		// Preferir C:\CompilaRC para que el operador no tenga rutas ocultas
		return `C:\CompilaRC`
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, "CompilaRC")
}

type ProgresoInfo struct {
	Porcentaje int    `json:"porcentaje"`
	Mensaje    string `json:"mensaje"`
	Completado bool   `json:"completado"`
	Error      string `json:"error"`
}

// IniciarInstalacion extrae los binarios, bases de datos y crea accesos directos
func (a *App) IniciarInstalacion(rutaDestino string, crearAccesoEscritorio bool) error {
	if rutaDestino == "" {
		rutaDestino = a.ObtenerRutaDefecto()
	}

	go func() {
		notificar := func(porcentaje int, mensaje string) {
			wailsRuntime.EventsEmit(a.ctx, "progreso_instalacion", ProgresoInfo{
				Porcentaje: porcentaje,
				Mensaje:    mensaje,
				Completado: false,
			})
			time.Sleep(350 * time.Millisecond) // Transición visual suave
		}

		notificar(15, "Creando directorio de trabajo seguro...")
		dataDir := filepath.Join(rutaDestino, "data")
		if err := os.MkdirAll(dataDir, 0755); err != nil {
			// Si C:\CompilaRC no tiene permisos de admin, usar %LOCALAPPDATA%\CompilaRC
			if userConfig, uerr := os.UserConfigDir(); uerr == nil {
				rutaDestino = filepath.Join(userConfig, "CompilaRC")
				dataDir = filepath.Join(rutaDestino, "data")
				_ = os.MkdirAll(dataDir, 0755)
			}
		}

		notificar(35, "Desplegando componentes del ejecutable CompilaRC Desktop...")
		exePath := filepath.Join(rutaDestino, "compilarc-desktop.exe")
		if err := os.WriteFile(exePath, payloadExe, 0755); err != nil {
			wailsRuntime.EventsEmit(a.ctx, "progreso_instalacion", ProgresoInfo{
				Porcentaje: 35,
				Mensaje:    "Error escribiendo ejecutable",
				Error:      err.Error(),
			})
			return
		}

		notificar(50, "Instalando controlador de captura biométrica Futronic FS88H...")
		dllPath := filepath.Join(rutaDestino, "ftrScanAPI.dll")
		_ = os.WriteFile(dllPath, payloadFtrScanAPI, 0644)

		iconPath := filepath.Join(rutaDestino, "appicon.ico")
		_ = os.WriteFile(iconPath, payloadIcon, 0644)

		notificar(65, "Configurando conexión con Servidor Central (192.168.213.42)...")
		cfgData := []byte(`{
  "server_url": "http://192.168.213.42:8080",
  "api_key": "P!Y2lFcqAiV1E][p",
  "estacion_id": "TAQUILLA-01"
}`)
		_ = os.WriteFile(filepath.Join(rutaDestino, "config.json"), cfgData, 0644)
		_ = os.WriteFile(filepath.Join(dataDir, "config.json"), cfgData, 0644)

		notificar(80, "Inicializando almacenamiento seguro y padrón local...")
		acPath := filepath.Join(dataDir, "ac_local.db")
		_ = os.WriteFile(acPath, payloadAC, 0644)

		packPath := filepath.Join(dataDir, "solicitudes_offline.db")
		_ = os.WriteFile(packPath, payloadPackets, 0644)

		notificar(90, "Creando acceso directo institucional en el Escritorio...")
		if runtime.GOOS == "windows" && crearAccesoEscritorio {
			a.crearAccesoDirectoWindows(exePath, rutaDestino, iconPath)
		}

		notificar(100, "¡Instalación completada exitosamente!")
		wailsRuntime.EventsEmit(a.ctx, "progreso_instalacion", ProgresoInfo{
			Porcentaje: 100,
			Mensaje:    "CompilaRC Desktop está listo para operar.",
			Completado: true,
		})
	}()

	return nil
}

func (a *App) crearAccesoDirectoWindows(targetExe, workDir, iconPath string) {
	// 1. Crear via VBScript (el método más confiable y nativo en Windows 10/11)
	vbsContent := fmt.Sprintf(`Set WshShell = CreateObject("WScript.Shell")
pubDesktop = "C:\Users\Public\Desktop"
If CreateObject("Scripting.FileSystemObject").FolderExists(pubDesktop) Then
    Set sc1 = WshShell.CreateShortcut(pubDesktop & "\CompilaRC Desktop.lnk")
    sc1.TargetPath = "%s"
    sc1.WorkingDirectory = "%s"
    sc1.IconLocation = "%s,0"
    sc1.Description = "Estacion Oficial de Registro Civil y Captura Biometrica (CNE)"
    sc1.Save
End If

userDesktop = WshShell.SpecialFolders("Desktop")
Set sc2 = WshShell.CreateShortcut(userDesktop & "\CompilaRC Desktop.lnk")
sc2.TargetPath = "%s"
sc2.WorkingDirectory = "%s"
sc2.IconLocation = "%s,0"
sc2.Description = "Estacion Oficial de Registro Civil y Captura Biometrica (CNE)"
sc2.Save

allPrograms = WshShell.SpecialFolders("AllUsersPrograms")
Set sc3 = WshShell.CreateShortcut(allPrograms & "\CompilaRC Desktop.lnk")
sc3.TargetPath = "%s"
sc3.WorkingDirectory = "%s"
sc3.IconLocation = "%s,0"
sc3.Save
`, targetExe, workDir, iconPath, targetExe, workDir, iconPath, targetExe, workDir, iconPath)

	tempVbs := filepath.Join(os.TempDir(), "compilarc_shortcut.vbs")
	if err := os.WriteFile(tempVbs, []byte(vbsContent), 0644); err == nil {
		cmdVbs := exec.Command("wscript.exe", tempVbs)
		_ = cmdVbs.Run()
		_ = os.Remove(tempVbs)
	}

	// 2. Respaldo adicional con PowerShell
	psScript := fmt.Sprintf(`
		$WshShell = New-Object -comObject WScript.Shell
		$paths = @(
			"C:\Users\Public\Desktop",
			[Environment]::GetFolderPath('Desktop'),
			[Environment]::GetFolderPath('CommonDesktopDirectory')
		)
		foreach ($p in $paths) {
			if (Test-Path $p) {
				$sc = $WshShell.CreateShortcut("$p\CompilaRC Desktop.lnk")
				$sc.TargetPath = "%s"
				$sc.WorkingDirectory = "%s"
				$sc.IconLocation = "%s,0"
				$sc.Description = "Estacion Oficial de Registro Civil y Captura Biometrica (CNE)"
				$sc.Save()
			}
		}
	`, targetExe, workDir, iconPath)
	cmdPs := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", psScript)
	_ = cmdPs.Run()

	// 3. Forzar refresco de caché de iconos en Windows Shell
	cmdRefresh := exec.Command("cmd.exe", "/c", "ie4uinit.exe -show")
	_ = cmdRefresh.Run()
}

// EjecutarAppIniciada lanza el ejecutable instalado y cierra el instalador
func (a *App) EjecutarAppIniciada(rutaDestino string) {
	if rutaDestino == "" {
		rutaDestino = a.ObtenerRutaDefecto()
	}
	exePath := filepath.Join(rutaDestino, "compilarc-desktop.exe")
	if runtime.GOOS == "windows" {
		cmd := exec.Command(exePath)
		cmd.Dir = rutaDestino
		_ = cmd.Start()
	}
	wailsRuntime.Quit(a.ctx)
}

func (a *App) CerrarInstalador() {
	wailsRuntime.Quit(a.ctx)
}

func copiarArchivoGrande(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	buf := make([]byte, 1024*1024*8) // 8MB buffer para copia ultrarrápida
	_, err = io.CopyBuffer(out, in, buf)
	return err
}
