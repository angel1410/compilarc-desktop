package main

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

// DBLocation contiene información de una base de datos offline encontrada
type DBLocation struct {
	Path        string
	Origen      string
	Size        int64
	Modificado  string
}

// BuscarBasesDeDatos busca instancias de solicitudes_offline.db en el sistema y discos conectados
func BuscarBasesDeDatos(driveRaiz string) []DBLocation {
	var encontradas []DBLocation
	vistas := make(map[string]bool)

	agregarSiExiste := func(ruta, origen string) {
		rutaAbs, err := filepath.Abs(ruta)
		if err != nil {
			rutaAbs = ruta
		}
		if vistas[rutaAbs] {
			return
		}
		if info, err := os.Stat(rutaAbs); err == nil && !info.IsDir() {
			vistas[rutaAbs] = true
			encontradas = append(encontradas, DBLocation{
				Path:       rutaAbs,
				Origen:     origen,
				Size:       info.Size(),
				Modificado: info.ModTime().Format("2006-01-02 15:04:05"),
			})
		}
	}

	// 1. Si el usuario especificó una ruta o unidad específica
	if driveRaiz != "" {
		explorarDirectorioRaiz(driveRaiz, "Unidad indicada ("+driveRaiz+")", agregarSiExiste)
		return encontradas
	}

	// 2. Directorio de trabajo local y carpetas estándar de usuario
	agregarSiExiste(filepath.Join("data", "solicitudes_offline.db"), "Directorio local / portable")
	if userConfig, err := os.UserConfigDir(); err == nil {
		agregarSiExiste(filepath.Join(userConfig, "CompilaRC", "data", "solicitudes_offline.db"), "AppData Usuario Actual")
	}

	// 3. Escaneo según sistema operativo
	if runtime.GOOS == "windows" {
		escanearDiscosWindows(agregarSiExiste)
	} else {
		escanearDiscosLinux(agregarSiExiste)
	}

	return encontradas
}

// escanearDiscosWindows revisa unidades lógicas montadas (D:, E:, F:, ..., C:)
func escanearDiscosWindows(agregar func(string, string)) {
	// Revisar de la D a la Z (unidades externas/secundarias primero), luego C:
	unidades := []rune{}
	for c := 'D'; c <= 'Z'; c++ {
		unidades = append(unidades, c)
	}
	unidades = append(unidades, 'C')

	for _, letra := range unidades {
		root := fmt.Sprintf("%c:\\", letra)
		if _, err := os.Stat(root); err == nil {
			explorarDirectorioRaiz(root, fmt.Sprintf("Disco %c:", letra), agregar)
		}
	}
}

// escanearDiscosLinux revisa puntos de montaje comunes para discos USB
func escanearDiscosLinux(agregar func(string, string)) {
	puntosMontaje := []string{"/media", "/run/media", "/mnt"}

	for _, p := range puntosMontaje {
		entries, err := os.ReadDir(p)
		if err != nil {
			continue
		}
		for _, e := range entries {
			subPath := filepath.Join(p, e.Name())
			// Si es /media/usuario o /run/media/usuario, explorar sus subcarpetas
			if p == "/media" || p == "/run/media" {
				subs, err := os.ReadDir(subPath)
				if err == nil {
					for _, s := range subs {
						mount := filepath.Join(subPath, s.Name())
						explorarDirectorioRaiz(mount, "USB: "+mount, agregar)
					}
				}
			}
			explorarDirectorioRaiz(subPath, "Montaje: "+subPath, agregar)
		}
	}
}

// explorarDirectorioRaiz prueba las rutas típicas de instalación de Windows y portátiles
func explorarDirectorioRaiz(root, origen string, agregar func(string, string)) {
	rutasCandidatas := []string{
		filepath.Join(root, "data", "solicitudes_offline.db"),
		filepath.Join(root, "CompilaRC", "data", "solicitudes_offline.db"),
		filepath.Join(root, "compilarc-desktop", "data", "solicitudes_offline.db"),
		filepath.Join(root, "Program Files", "CompilaRC", "data", "solicitudes_offline.db"),
		filepath.Join(root, "Program Files (x86)", "CompilaRC", "data", "solicitudes_offline.db"),
	}

	for _, r := range rutasCandidatas {
		agregar(r, origen)
	}

	// Buscar en Users/*/AppData/Roaming/CompilaRC/data/
	usersDir := filepath.Join(root, "Users")
	if uEntries, err := os.ReadDir(usersDir); err == nil {
		for _, u := range uEntries {
			if u.IsDir() {
				appDataPath := filepath.Join(usersDir, u.Name(), "AppData", "Roaming", "CompilaRC", "data", "solicitudes_offline.db")
				agregar(appDataPath, fmt.Sprintf("%s (Usuario: %s)", origen, u.Name()))
			}
		}
	}
}
