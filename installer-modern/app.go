package main

import (
	"context"
	_ "embed"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed payload/compilarc-desktop.exe
var payloadExe []byte

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

		notificar(60, "Configurando base de datos local SQLite (Padrón AC)...")
		acPath := filepath.Join(dataDir, "ac_local.db")
		_ = os.WriteFile(acPath, payloadAC, 0644)

		notificar(75, "Inicializando almacenamiento seguro de solicitudes offline...")
		packPath := filepath.Join(dataDir, "solicitudes_offline.db")
		_ = os.WriteFile(packPath, payloadPackets, 0644)

		notificar(90, "Creando acceso directo institucional en el Escritorio...")
		if runtime.GOOS == "windows" && crearAccesoEscritorio {
			a.crearAccesoDirectoWindows(exePath, rutaDestino)
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

func (a *App) crearAccesoDirectoWindows(targetExe, workDir string) {
	psScript := fmt.Sprintf(`
		$WshShell = New-Object -comObject WScript.Shell
		$DesktopPath = [Environment]::GetFolderPath('Desktop')
		$Shortcut = $WshShell.CreateShortcut("$DesktopPath\CompilaRC Desktop.lnk")
		$Shortcut.TargetPath = "%s"
		$Shortcut.WorkingDirectory = "%s"
		$Shortcut.IconLocation = "%s,0"
		$Shortcut.Description = "Estación Oficial de Registro Civil y Captura Biométrica (CNE)"
		$Shortcut.Save()

		$ProgramsPath = [Environment]::GetFolderPath('Programs')
		$ShortcutMenu = $WshShell.CreateShortcut("$ProgramsPath\CompilaRC Desktop.lnk")
		$ShortcutMenu.TargetPath = "%s"
		$ShortcutMenu.WorkingDirectory = "%s"
		$ShortcutMenu.IconLocation = "%s,0"
		$ShortcutMenu.Save()
	`, targetExe, workDir, targetExe, targetExe, workDir, targetExe)

	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", psScript)
	_ = cmd.Run()
}

// EjecutarAppIniciada lanza el ejecutable instalado y cierra el instalador
func (a *App) EjecutarAppIniciada(rutaDestino string) {
	if rutaDestino == "" {
		rutaDestino = a.ObtenerRutaDefecto()
	}
	exePath := filepath.Join(rutaDestino, "compilarc-desktop.exe")
	if runtime.GOOS == "windows" {
		cmd := exec.Command(exePath)
		_ = cmd.Start()
	}
	wailsRuntime.Quit(a.ctx)
}

func (a *App) CerrarInstalador() {
	wailsRuntime.Quit(a.ctx)
}
