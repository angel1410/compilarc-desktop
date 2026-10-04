# CompilaRC Desktop (Estación de Captura y Registro Civil)

Aplicación de escritorio **Offline-First** desarrollada con **Wails v2 (Go 1.22+)** y **React 19 + TypeScript + Tailwind CSS 4**, diseñada para estaciones de trabajo y taquillas de Registro Civil con soporte para validación instantánea de ciudadanos (<3ms) y captura biométrica certificada (PIAC / CNE).

---

## 🏛️ Características Principales

- **Arquitectura Híbrida Offline-First**: Permite la recepción y registro completo de solicitudes de actas aún sin conexión a internet.
- **Padrón Local (Archivo Cedular)**: Motor SQLite optimizado con modo WAL y búsqueda indexada en menos de 3 milisegundos.
- **Biometría Futronic FS88H (USB 2.0 PIV)**: Integración con sensor óptico con soporte LFD (Live Finger Detection) y modo de simulación automática para desarrollo/pruebas sin hardware físico.
- **Lotes Offline Cifrados**: Cola local en SQLite (`solicitudes_offline.db`) lista para transmisión por lotes a CompilaRC Web.
- **Formularios Registrales Completos**:
  - **Nacimiento**: Solicitante con parentesco dinámico, Madre (obligatoria), Padre (opcional) y Presentado con catálogo geográfico venezolano 100% offline.
  - **Defunción**: Solicitante con parentesco, Fallecido y acta de defunción.
  - **Matrimonio y Unión Estable de Hecho**: Preparados y modulares.
- **Detección Automática de Red (Cableada Ethernet / Wi-Fi)**: Diagnóstico en tiempo real mediante APIs nativas de Windows (`GetAdaptersAddresses`) y Linux (`/sys/class/net`), conmutación automática fluida entre modo Online y Offline seguro, verificación de latencia y opción de forzado manual por operador.
- **Multiplataforma**: Compilación nativa para Linux (`webkit2gtk-4.1`) y Windows (`amd64`).

---

## 🛠️ Requisitos Previos

### Linux (Fedora / Ubuntu / Debian)
- **Go**: 1.22 o superior
- **Node.js**: v20 o superior y `npm`
- **Wails v2**:
  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```
- **Librerías GTK/WebKit**:
  - **Fedora**: `sudo dnf install webkit2gtk4.1-devel gtk3-devel`
  - **Ubuntu**: `sudo apt install libwebkit2gtk-4.1-dev build-essential`

### Windows (o Windows Virtualizado)
- **Go**: 1.22+
- **Node.js**: v20+
- **Microsoft Edge WebView2**: Incluido por defecto en Windows 10/11.

---

## 🚀 Puesta en Marcha en Desarrollo

1. **Instalar dependencias del frontend**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

2. **Ejecutar en modo desarrollo con Hot-Reload**:
   ```bash
   wails dev
   ```

---

## 📦 Compilación de Binarios

### Compilar para Linux:
```bash
wails build -tags webkit2_41
# El binario se genera en build/bin/compilarc-desktop
```

### Compilar para Windows (Cross-compilation desde Linux):
```bash
wails build -platform windows/amd64
# El ejecutable se genera en build/bin/compilarc-desktop.exe
```

---

## 💾 Persistencia de Bases de Datos SQLite

La aplicación gestiona automáticamente el almacenamiento local:
1. **Modo Portátil**: Busca o crea una carpeta `./data` en el mismo directorio donde se ejecuta el binario.
2. **Auto-inicialización (Seed)**: Si `ac_local.db` no existe, se crea el esquema y se siembran ciudadanos demo para pruebas inmediatas:
   - `V-24749645`: Paola Nathaly Irazabal Riera (F)
   - `V-12345678`: Carlos Alberto Perez Rodriguez (M)
   - `V-87654321`: Maria Elena Gonzalez Lopez (F)
3. **Instalación en Sistema**: Si el ejecutable reside en un directorio de solo lectura (como `C:\Program Files`), los datos se redirigen automáticamente a `%APPDATA%\CompilaRC\data` en Windows o `~/.config/CompilaRC/data` en Linux.
