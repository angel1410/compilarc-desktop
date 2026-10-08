package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"runtime"
	"strings"

	"compilarc-desktop/internal/crypto"
	"compilarc-desktop/internal/storage"
)

const version = "1.0.0"

func imprimirBanner() {
	fmt.Println("======================================================================")
	fmt.Println("   🏛️  COMPILARC DESKTOP - HERRAMIENTA FORENSE DE RECUPERACIÓN")
	fmt.Printf("          Versión %s | Multiplataforma (Linux / Windows)\n", version)
	fmt.Println("======================================================================")
}

func main() {
	var (
		flagDB         string
		flagDrive      string
		flagKey        string
		flagOutput     string
		flagWebURL     string
		flagToken      string
		flagMarkSynced bool
	)

	flag.StringVar(&flagDB, "db", "", "Ruta directa al archivo solicitudes_offline.db")
	flag.StringVar(&flagDrive, "drive", "", "Unidad de disco o carpeta raíz donde buscar (ej. E: o /media/angel/DISCO)")
	flag.StringVar(&flagKey, "key", "", "Clave maestra personalizada de desencriptación (opcional)")
	flag.StringVar(&flagOutput, "out", "", "Ruta de archivo destino para exportación JSON")
	flag.StringVar(&flagWebURL, "url", "http://localhost:8080/api/v1/solicitudes/sincronizar-lote-desktop", "URL de la API de CompilaRC-Web")
	flag.StringVar(&flagToken, "token", "", "Token de autenticación Bearer para CompilaRC-Web")
	flag.BoolVar(&flagMarkSynced, "mark-synced", false, "Marcar las solicitudes como sincronizadas en la BD original tras exportar")

	flag.Usage = func() {
		imprimirBanner()
		fmt.Println("Uso: compilarc-rescue [comando] [opciones]")
		fmt.Println("\nComandos disponibles:")
		fmt.Println("  scan     Busca y analiza bases de datos offline en discos USB y locales")
		fmt.Println("  inspect  Muestra el detalle forense de las solicitudes pendientes")
		fmt.Println("  export   Exporta solicitudes pendientes a un paquete JSON con suma SHA-256")
		fmt.Println("  sync     Transmite las solicitudes pendientes directamente a CompilaRC-Web")
		fmt.Println("\nSi se ejecuta sin comandos, se abrirá el menú interactivo.")
		fmt.Println("\nOpciones:")
		flag.PrintDefaults()
	}

	flag.Parse()
	args := flag.Args()

	// Obtener la llave criptográfica
	var key []byte
	if flagKey != "" {
		key = crypto.DerivarLlave(flagKey)
	} else {
		key = crypto.ObtenerLlaveMaestra()
	}

	if len(args) == 0 {
		ejecutarModoInteractivo(flagDB, flagDrive, key, flagWebURL, flagToken)
		pausarSiWindows()
		return
	}

	comando := strings.ToLower(args[0])
	switch comando {
	case "scan":
		cmdScan(flagDB, flagDrive, key)
	case "inspect":
		cmdInspect(flagDB, flagDrive, key)
	case "export":
		cmdExport(flagDB, flagDrive, key, flagOutput, flagMarkSynced)
	case "sync":
		cmdSync(flagDB, flagDrive, key, flagWebURL, flagToken)
	default:
		fmt.Printf("Comando no reconocido: %s\n\n", comando)
		flag.Usage()
		os.Exit(1)
	}
}

func pausarSiWindows() {
	if runtime.GOOS == "windows" {
		fmt.Print("\nPresione ENTER para salir...")
		_, _ = bufio.NewReader(os.Stdin).ReadString('\n')
	}
}

func seleccionarBD(dbPath, drive string) string {
	if dbPath != "" {
		if _, err := os.Stat(dbPath); err == nil {
			return dbPath
		}
		fmt.Printf("⚠️ La ruta de base de datos indicada no existe: %s\n", dbPath)
	}

	fmt.Println("🔍 Buscando bases de datos en discos conectados...")
	dbs := BuscarBasesDeDatos(drive)
	if len(dbs) == 0 {
		fmt.Println("❌ No se encontraron archivos 'solicitudes_offline.db'.")
		fmt.Println("   Conecte el disco USB o especifique la ruta exacta con --db <ruta>.")
		return ""
	}

	if len(dbs) == 1 {
		fmt.Printf("✅ Se encontró automáticamente la base de datos:\n   -> %s (%s)\n", dbs[0].Path, dbs[0].Origen)
		return dbs[0].Path
	}

	fmt.Println("\nSe encontraron múltiples bases de datos:")
	for i, d := range dbs {
		fmt.Printf("  [%d] %s\n      Origen: %s | Tamaño: %d KB | Modif: %s\n", i+1, d.Path, d.Origen, d.Size/1024, d.Modificado)
	}

	reader := bufio.NewReader(os.Stdin)
	for {
		fmt.Print("\nSeleccione el número de la base de datos a procesar: ")
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)
		var sel int
		if _, err := fmt.Sscanf(input, "%d", &sel); err == nil && sel >= 1 && sel <= len(dbs) {
			return dbs[sel-1].Path
		}
		fmt.Println("Opción inválida. Intente de nuevo.")
	}
}

func cmdScan(dbPath, drive string, key []byte) {
	imprimirBanner()
	targetDB := seleccionarBD(dbPath, drive)
	if targetDB == "" {
		return
	}

	storage, err := storage.NewPacketStorageWithKey(targetDB, key)
	if err != nil {
		fmt.Printf("❌ Error al abrir la base de datos: %v\n", err)
		return
	}
	defer storage.Close()

	stats, err := storage.ObtenerEstadisticas()
	if err != nil {
		fmt.Printf("❌ Error al leer estadísticas: %v\n", err)
		return
	}

	pendientes, err := storage.ListarPendientes()
	if err != nil {
		fmt.Printf("❌ Error al leer solicitudes pendientes: %v\n", err)
		return
	}

	// Agrupar pendientes por tipo de acta
	porTipo := make(map[string]int)
	for _, p := range pendientes {
		porTipo[p.TipoActa]++
	}

	fmt.Println("\n📊 RESUMEN FORENSE DE LA BASE DE DATOS:")
	fmt.Printf("   Ubicación: %s\n", targetDB)
	fmt.Printf("   Total histórico de registros:  %d\n", stats["total"])
	fmt.Printf("   Total ya transmitidos / sinc:  %d\n", stats["sincronizados"])
	fmt.Printf("   🚨 SOLICITUDES PENDIENTES:      %d\n", stats["pendientes"])

	if len(porTipo) > 0 {
		fmt.Println("\n   Desglose de pendientes por trámite:")
		for tipo, cnt := range porTipo {
			fmt.Printf("     • %-22s: %d\n", tipo, cnt)
		}
	}
}

func cmdInspect(dbPath, drive string, key []byte) {
	imprimirBanner()
	targetDB := seleccionarBD(dbPath, drive)
	if targetDB == "" {
		return
	}

	storage, err := storage.NewPacketStorageWithKey(targetDB, key)
	if err != nil {
		fmt.Printf("❌ Error al abrir la base de datos: %v\n", err)
		return
	}
	defer storage.Close()

	pendientes, err := storage.ListarPendientes()
	if err != nil {
		fmt.Printf("❌ Error al desencriptar solicitudes: %v\n", err)
		return
	}

	if len(pendientes) == 0 {
		fmt.Println("\n✅ No hay solicitudes pendientes por transmitir en este disco.")
		return
	}

	fmt.Printf("\n📋 DETALLE DE %d SOLICITUDES PENDIENTES:\n", len(pendientes))
	fmt.Println("----------------------------------------------------------------------")
	for i, p := range pendientes {
		cedula := "N/A"
		nombre := "N/A"
		if c, ok := p.DatosSolicitante["cedula"].(string); ok && c != "" {
			cedula = c
		}
		if n, ok := p.DatosSolicitante["nombres"].(string); ok && n != "" {
			nombre = n
		} else if n, ok := p.DatosSolicitante["nombre"].(string); ok && n != "" {
			nombre = n
		}

		tieneBio := "NO"
		if len(p.DatosBiometricos) > 0 {
			tieneBio = "SÍ"
		}

		fmt.Printf("[%02d] ID: %s\n", i+1, p.ID)
		fmt.Printf("     Trámite: %-15s | Operador: %-15s | Fecha: %s\n", p.TipoActa, p.Operador, p.CreadoEn)
		fmt.Printf("     Solicitante: %s (%s) | Biometría: %s\n", cedula, nombre, tieneBio)
		fmt.Println("----------------------------------------------------------------------")
	}
}

func cmdExport(dbPath, drive string, key []byte, outputPath string, markSynced bool) {
	imprimirBanner()
	targetDB := seleccionarBD(dbPath, drive)
	if targetDB == "" {
		return
	}

	storage, err := storage.NewPacketStorageWithKey(targetDB, key)
	if err != nil {
		fmt.Printf("❌ Error al abrir la base de datos: %v\n", err)
		return
	}
	defer storage.Close()

	pendientes, err := storage.ListarPendientes()
	if err != nil {
		fmt.Printf("❌ Error al leer solicitudes pendientes: %v\n", err)
		return
	}

	if len(pendientes) == 0 {
		fmt.Println("\n✅ No hay solicitudes pendientes para exportar.")
		return
	}

	// 1. Crear backup de seguridad de la BD
	bakPath, err := CrearBackupSeguridad(targetDB)
	if err != nil {
		fmt.Printf("⚠️ Advertencia: No se pudo generar copia .bak de la BD: %v\n", err)
	} else {
		fmt.Printf("🛡️ Copia de seguridad forense creada en:\n   -> %s\n", bakPath)
	}

	// 2. Exportar a JSON
	outReal, err := ExportarRescateJSON(pendientes, targetDB, outputPath)
	if err != nil {
		fmt.Printf("❌ Error al exportar paquete JSON: %v\n", err)
		return
	}

	fmt.Printf("\n📦 PAQUETE DE RESCATE EXPORTADO EXITOSAMENTE:\n")
	fmt.Printf("   Archivo:   %s\n", outReal)
	fmt.Printf("   Checksum:  %s.sha256\n", outReal)
	fmt.Printf("   Cantidad:  %d solicitudes\n", len(pendientes))

	// 3. Marcar como sincronizado si fue solicitado
	if markSynced {
		var ids []string
		for _, p := range pendientes {
			ids = append(ids, p.ID)
		}
		if err := storage.ActualizarEstado(ids, "RESCATADO_FORENSE"); err != nil {
			fmt.Printf("⚠️ No se pudieron marcar las solicitudes en la BD: %v\n", err)
		} else {
			fmt.Printf("✅ Las %d solicitudes fueron marcadas como 'RESCATADO_FORENSE' en el disco.\n", len(ids))
		}
	}
}

func cmdSync(dbPath, drive string, key []byte, webURL, token string) {
	imprimirBanner()
	targetDB := seleccionarBD(dbPath, drive)
	if targetDB == "" {
		return
	}

	storage, err := storage.NewPacketStorageWithKey(targetDB, key)
	if err != nil {
		fmt.Printf("❌ Error al abrir la base de datos: %v\n", err)
		return
	}
	defer storage.Close()

	pendientes, err := storage.ListarPendientes()
	if err != nil {
		fmt.Printf("❌ Error al leer solicitudes pendientes: %v\n", err)
		return
	}

	if len(pendientes) == 0 {
		fmt.Println("\n✅ No hay solicitudes pendientes para transmitir.")
		return
	}

	fmt.Printf("\nTransfiriendo %d solicitudes hacia: %s ...\n", len(pendientes), webURL)

	// Crear backup antes de sincronizar
	bakPath, err := CrearBackupSeguridad(targetDB)
	if err == nil {
		fmt.Printf("🛡️ Copia de seguridad previa guardada en: %s\n", bakPath)
	}

	status, err := TransmitirAWeb(webURL, token, pendientes)
	if err != nil {
		fmt.Printf("❌ Error de transmisión: %v\n", err)
		fmt.Println("\n💡 Tip: Si la máquina no tiene acceso a internet o a CompilaRC-Web,")
		fmt.Println("   utilice el comando 'export' para generar un archivo JSON y llevarlo en un pendrive.")
		return
	}

	var ids []string
	for _, p := range pendientes {
		ids = append(ids, p.ID)
	}
	_ = storage.ActualizarEstado(ids, "SINCRONIZADO")

	fmt.Printf("\n🎉 TRANSMISIÓN EXITOSA (Código HTTP %d)!\n", status)
	fmt.Printf("   Se sincronizaron %d solicitudes y se actualizaron en la base de datos.\n", len(ids))
}

func ejecutarModoInteractivo(dbPath, drive string, key []byte, webURL, token string) {
	imprimirBanner()
	reader := bufio.NewReader(os.Stdin)

	for {
		fmt.Println("\nMENÚ DE ACCIONES:")
		fmt.Println("  [1] 🔍 Escanear discos y ver resumen de solicitudes")
		fmt.Println("  [2] 📋 Inspeccionar detalle de solicitudes pendientes")
		fmt.Println("  [3] 📦 Exportar lote de rescate a archivo JSON + SHA256")
		fmt.Println("  [4] 🌐 Transmitir directamente a CompilaRC-Web API")
		fmt.Println("  [5] 🚪 Salir")
		fmt.Print("\nSeleccione una opción [1-5]: ")

		opcion, _ := reader.ReadString('\n')
		opcion = strings.TrimSpace(opcion)

		switch opcion {
		case "1":
			cmdScan(dbPath, drive, key)
		case "2":
			cmdInspect(dbPath, drive, key)
		case "3":
			fmt.Print("¿Marcar las solicitudes como 'RESCATADO_FORENSE' en el disco? (s/N): ")
			confirm, _ := reader.ReadString('\n')
			mark := strings.ToLower(strings.TrimSpace(confirm)) == "s"
			cmdExport(dbPath, drive, key, "", mark)
		case "4":
			fmt.Printf("URL destino [%s]: ", webURL)
			urlInput, _ := reader.ReadString('\n')
			urlInput = strings.TrimSpace(urlInput)
			if urlInput != "" {
				webURL = urlInput
			}
			cmdSync(dbPath, drive, key, webURL, token)
		case "5":
			fmt.Println("Saliendo de la herramienta de recuperación forense.")
			return
		default:
			fmt.Println("Opción no válida.")
		}
	}
}
