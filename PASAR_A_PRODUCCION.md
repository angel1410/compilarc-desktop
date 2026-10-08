# GUÍA DE CONFIGURACIÓN Y DESPLIEGUE EN PRODUCCIÓN
## CompilaRC Desktop & Captura Biométrica CNE (PIAC)

Documento técnico de referencia para el pase a producción de las estaciones de trabajo de Registro Civil (CompilaRC Desktop) y su integración con los servidores centrales y el servicio biométrico del Consejo Nacional Electoral (CNE).

---

### 1. ARQUITECTURA DE INTEGRACIÓN BIOMÉTRICA

```
+----------------------------------+        LAN / WAN        +--------------------------------+
|    Estación de Trabajo Windows   |  ------------------->   |  Servidor Central CompilaRC   |
| (CompilaRC Desktop x64 Portable) |   HTTP / HTTPS :8080    | (Go Backend + PostgreSQL AC)   |
|                                  |                         |                                |
|  - Sensor Futronic FS88H (USB)   |                         +---------------+----------------+
|  - ftrScanAPI.dll (Nativo x64)   |                                         |  VPN CNE (ppp0)
|  - Toma directa óptica 500 DPI   |                                         v
|  - Padrón AC Local (36.6M SQLite)|                         +--------------------------------+
+----------------------------------+                         |    Servicio PIAC CNE AFIS      |
                                                             | (API Transaction CNE / Red PIAC)|
                                                             | Motor: Neurotechnology AFIS    |
                                                             +--------------------------------+
```

#### Aclaratoria sobre Licencias (Neurotechnology vs Futronic)
* **Estaciones de Trabajo (Laptops / Clientes):** **NO requieren licencias de Neurotechnology**. Solo requieren el controlador oficial de Windows de Futronic y la biblioteca nativa de enlace `ftrScanAPI.dll` (x64), la cual se distribuye libre de costo con los equipos Futronic.
* **Servidor Central CNE (PIAC):** Es donde reside el motor AFIS de Neurotechnology que realiza la comparación 1:1 o 1:N contra la base de datos electoral del CNE.

---

### 2. REQUISITOS EN LAS ESTACIONES DE TRABAJO (WINDOWS 10 / 11 x64)

1. **Controlador del Sensor Futronic FS88H:**
   - Instalar el driver oficial de Futronic para Windows 10/11 x64 (`ftrDriverSetup_win8_whql_3471.exe`).
   - En el Administrador de Dispositivos (`devmgmt.msc`), verificar que aparezca como:
     `Futronic USB Fingerprint Scanner Device` (sin signo de interrogación amarillo).
2. **Biblioteca de Enlace `ftrScanAPI.dll`:**
   - Debe ser la versión de **64 bits (x86_64)**.
   - Ubicación: Se incluye automáticamente dentro del instalador de CompilaRC en `C:\CompilaRC\ftrScanAPI.dll`.
   - Opcionalmente puede copiarse a `C:\Windows\System32\ftrScanAPI.dll`.
3. **Conexión al Servidor Central:**
   - En el archivo de configuración o al iniciar, la aplicación apunta al backend de producción (por defecto: `http://192.168.213.42:8080` o dominio institucional asignado).
4. **Archivo Cedular Completo (36.6 Millones) en Local:**
   - Ubicado en `C:\Compilarc\data\cedulados_full.db` (o `ac_local.db`).
   - Provee validación instantánea (<1ms) de cualquier ciudadano venezolano o extranjero (V/E) sin requerir conexión a internet.

---

### 3. CONFIGURACIÓN DEL SERVIDOR CENTRAL Y SEGURIDAD CNE / PIAC

#### 🔐 Blindaje de Confidencialidad (Bóveda AES-256-GCM):
Para cumplir los lineamientos de seguridad de **PIAC / CNE**, **las direcciones IP y puertos internos de validación biométrica NO se encuentran en texto plano en el repositorio GitHub (`develop`)**:
- El backend en Go (`security/biometric_vault.go`) resuelve el endpoint en memoria mediante descifrado simétrico AES-256-GCM al arrancar (impacto: 0 ms).
- **Sobrescritura por Entorno:** Si el servidor de producción requiere cambiar la IP o usar un host DNS interno, se define la variable `CNE_BIOMETRIA_URL` en el `.env` o en las variables del sistema (esta tiene prioridad sobre la bóveda interna).
- **Sanitización de Logs:** Los logs en disco (`logs/main-producer-*.log`) enmascaran la URL del CNE registrando únicamente `endpoint seguro (/begin)` y `endpoint seguro (/verify)`.

En el archivo `.env` del backend de producción:
```env
# Conexión Base de Datos Padrón Registro Civil (36.6M registros)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=xxxx
DB_NAME=registro_civil_bd
DB_SSLMODE=disable

# Integración Biométrica PIAC CNE (Producción)
CNE_SIMULACION=false
# CNE_BIOMETRIA_URL=http://<IP_O_HOST_CNE_PIAC>:5080/api/Transaction

# Seguridad de red y orígenes permitidos
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.213.42:5173,http://192.168.213.42:8080
```

#### Verificación de Conectividad con el CNE (Pre-vuelo):
```bash
# 1. Verificar túnel VPN CNE
ip addr show ppp0

# 2. Probar conectividad con endpoint PIAC CNE
curl -s -o /dev/null -w "%{http_code}\n" http://<HOST_CNE_PIAC>:5080/api/Transaction
# Debe responder 405 (Method Not Allowed para GET), indicando que el servicio REST está activo.
```

---

### 4. ESPECIFICACIÓN DEL FLUJO Y PAYLOAD BIOMÉTRICO (PIAC CNE)

El cliente CompilaRC Desktop captura la imagen cruda (500 DPI, escala de grises de 8 bits) desde el sensor óptico Futronic FS88H e inmediatamente realiza **compresión nativa en memoria a formato WSQ (Wavelet Scalar Quantization de NIST/FBI a 0.75 bitrate)** mediante motor integrado Go (`jtejido/go-wsq`), sin requerir librerías externas de terceros.

El backend de CompilaRC ejecuta la verificación 1 a 1 ante el PIAC CNE en dos pasos atómicos:
1. **Paso 1: Inicio de Transacción (`POST /api/Transaction/begin`)**
   ```json
   {
     "identificationCountryCode": "VEN",
     "identificationCode": "CI",
     "identificationSerial": "V-12073739"
   }
   ```
   *Retorna:* Token de transacción `code` (ej: `7bf130a1-...`) y lista de dedos enrolados en AFIS (`RightThumb`, `RightIndex`, `LeftThumb`, `LeftIndex`).

2. **Paso 2: Comparación Dactilar (`POST /api/Transaction/{code}/verify`)**
   ```json
   {
     "fingers": [
       {
         "sample": "<BASE64_WSQ_DATA>",
         "capturedOn": "2026-10-06T13:42:20.000Z",
         "missing": false,
         "fingerprintType": "LiveScanPlain",
         "fingerType": "RightThumb",
         "imageResolution": 500
       }
     ]
   }
   ```
* **Evaluación de Respuestas del PIAC:**
  - `result: "Verified"` y score $\ge 40.0$: **Huella Verificada con Éxito**.
  - `result: "NotVerified"`: Rechazo por discrepancia de crestas papilares.
  - Errores temporales de CNE (código 500 o timeout): Se reportan al operador distinguiéndolos de fallas de red local.

---

### 5. FLUJO DE VALIDACIÓN EN TAQUILLA Y CONTROL DE ESTADOS

#### 5.1. Bloqueo Reactivo Integral de Pasos 2 y 3 (Cédula en AC + Biometría):
- **Regla Estricta:** La estación mantiene **bloqueados y no interactivos** los formularios de titulares/presentados (**Paso 2**), datos del acta (**Paso 3**) y el botón de guardado final hasta que la persona solicitante cumpla **ambas** condiciones en el **Paso 1**:
  1. **Validación en Archivo Cedular (AC):** Cédula existente y verificada contra el padrón nacional de 36.6M de registros.
  2. **Certificación Biométrica:**
     - **En Modo Online:** La huella dactilar debe haber sido capturada y **validada exitosamente ante el CNE/PIAC** (`verificado_piac === true` o score $\ge 40$).
     - **En Modo Offline:** La huella dactilar debe haber sido **capturada exitosamente con el sensor Futronic FS88H** (con muestra WSQ de calidad resguardada para lote cifrado).
- **Banners Informativos Dinámicos:** La interfaz muestra mensajes específicos y un acceso directo *"Escanear Huella en Paso 1"* para guiar al operador paso a paso.
- **Invalidez por Modificación:** Si se altera la cédula o nacionalidad del solicitante, la huella capturada se purga de forma preventiva y el sistema vuelve a bloquear los pasos 2 y 3 hasta que se tome una nueva muestra.

#### 5.2. Autocompletado Inteligente y Reseteos en Cascada:
- **Parentesco YO/TITULAR:** Al seleccionar *"YO"* en parentesco (nacimiento), se copian de forma automática los nombres, apellidos, fecha de nacimiento y sexo del solicitante hacia el presentado.
- **Reseteo Reactivo:** Si el operador modifica la cédula, la nacionalidad o desmarca el parentesco *"YO"*, el sistema limpia inmediatamente los campos dependientes del presentado y anula cualquier huella capturada previamente, garantizando la integridad de los datos.

#### 5.3. Selección de Dedos Normativos:
- El diálogo de captura biométrica restringe las opciones **exclusivamente a los 4 dedos normativos del CNE**:
  1. Pulgar Derecho (`RightThumb` / Dedo 1)
  2. Índice Derecho (`RightIndex` / Dedo 2)
  3. Pulgar Izquierdo (`LeftThumb` / Dedo 6)
  4. Índice Izquierdo (`LeftIndex` / Dedo 7)
  *(El dedo medio y dedos secundarios fueron removidos de la interfaz).*

#### 5.4. Indicadores de Estado en Cabecera:
- Los indicadores del sensor **Futronic FS88H** y del **Estado de Red** se presentan encapsulados en un contenedor redondeado con fondo blanco de alta visibilidad.
- Ambos elementos son **estrictamente informativos** (sin botones interactivos ni menús desplegables), reflejando con exactitud si el sensor está conectado por USB y la IP local asignada (cableada/Wi-Fi).

---

### 6. BASE DE DATOS LOCAL COMPLETA (36.6M REGISTROS)

La estación cuenta con una base de datos SQLite maestro en `C:\Compilarc\data\cedulados_full.db` que contiene:
- **`ac_local`:** 36,604,025 ciudadanos (V y E) con nombres, apellidos, fecha de nacimiento y sexo.
- **Índices de alta velocidad:** `(nacionalidad, cedula)` y `(cedula)`, permitiendo consultas en menos de 1 milisegundo.
- **Vista de compatibilidad `cedulados`:** Para interoperabilidad transparente con módulos legados.
- **Catálogos Oficiales:**
  - `c001t_geografico`: 1,906 registros de división político-territorial (Estados, Municipios, Parroquias).
  - `i001t_ourc`: 1,245 Oficinas y Unidades de Registro Civil.
  - `c004t_tipo_acta`: Tipos de acta (NAC, MAT, DEF).
  - `c002t_estado_proceso`: Estados de tramitación.

Para instalarla en la laptop:
```cmd
instalar_ac_laptop.bat
```
El script copia automáticamente el archivo a `C:\Compilarc\data\cedulados_full.db` y crea una copia en `ac_local.db`.

---

### 7. PAQUETE DE DISTRIBUCIÓN GENERADO (PORTAL LAN :9090)

Servidor HTTP de distribución activo en la red interna:
```
http://192.168.213.42:9090/
```

Archivos disponibles para descarga directa en las estaciones Windows:
1. `CompilaRC-Instalador-Moderno.exe` (38 MB): **Instalador autónomo actualizado.** Despliega `compilarc-desktop.exe` con todas las validaciones de flujo, indicadores de cabecera en caja blanca, bloqueo de Paso 2 y 3 sin cédula en AC, `ftrScanAPI.dll` (1.1 MB nativo x64) y accesos directos de escritorio.
2. `cedulados_full.zip` (1.6 GB comprimido) / `cedulados_full.db` (3.0 GB directo): **Base completa de 36.6M de registros** del Archivo Cedular + Catálogos geográficos y oficinas de registro.
3. `instalar_ac_laptop.bat`: Script batch para instalación automática de la base completa en `C:\Compilarc\data`.
4. `compilarc-desktop.exe` (29 MB): Binario principal compilado para reemplazo directo en instalaciones existentes.
5. `ftrScanAPI.dll` (1.1 MB): Biblioteca de enlace nativa x64 para el sensor Futronic FS88H.
6. `ftrDriverSetup_win8_whql_3471.exe`: Instalador del driver oficial de Futronic para Windows 10/11 x64.
7. `test-futronic.exe`: Utilidad de diagnóstico de hardware en consola.
8. `fondos/07_Classic_Blue_Corporate_1600x900.png`: Fondo oficial para Lenovo ThinkPad (1600x900) con cintillo tricolor superior, marca de agua CNE en el centro y barra institucional.
9. `appicon.png` / `icon.ico`: Ícono corporativo con contenedor squircle blanco brillante para máxima legibilidad en escritorio y barra de tareas.

---

### 8. PERSONALIZACIÓN INSTITUCIONAL DE INTERFAZ Y ESCRITORIO

#### 8.1. Fondo de Pantalla Oficial CNE ThinkPad (`07_Classic_Blue_Corporate`):
- **Superior:** Exclusivamente el cintillo tricolor nacional (`5px` con resplandor dorado/azul/rojo), sin recuadros ni distracciones.
- **Centro:** Marca de agua oficial del **Consejo Nacional Electoral (CNE - Poder Electoral)** con el arco tricolor y tipografía nítida iluminada.
- **Lateral Derecho:** Marca de agua tenue del sistema CompilARC.
- **Inferior:** Barra institucional elevada a `76px` para despejar completamente la barra de tareas de Windows (`Consejo Nacional Electoral | Comisión Nacional de Registro Civil y Electoral | Oficina Nacional de Registro Civil` + distintivo `ThinkPad T440p • 14" Institucional`).
- **Resoluciones provistas:** `1600x900` (nativa de laptop Lenovo ThinkPad) y `1920x1080` (Full HD).

#### 8.2. Ícono de Aplicación de Alto Contraste (Escritorio y Barra de Tareas):
- Contenedor geométrico tipo *squircle* blanco puro brillante (`#ffffff`) con micro-borde de definición Slate (`#e2e8f0`) y sombra ambiental suave, brindando 100% de contraste y legibilidad tanto en el escritorio como anclado a la barra de tareas.
- Mipmaps integrados en `.ico`: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128 y 256x256 (32-bit RGBA).

---

### 9. ARQUITECTURA DE INTEROPERABILIDAD Y CERTIFICACIÓN DIGITAL (CIVIS / BACKEND)

```
[Estación de Taquilla (CompilaRC Desktop)]
       │
       │ 1. Validación en AC Local (36.6M) + Captura WSQ Futronic FS88H
       │ 2. Validación Biométrica en Vivo (CNE PIAC :5080)
       ▼
   POST /api/v1/desktop/solicitudes
       │
       ▼
[Servidor Central (CompilaRC Backend :8080)]
       │
       │ 3. Registro transaccional en PostgreSQL (cert.c003t_solicitudes)
       │ 4. Consulta Directa a Plataforma CIVIS (Exclé)
       ▼
   POST https://10.21.101.9:7107/api/interop/special-certificate
   Header: x-api-key: [CLAVE_CIVIS]
       │
       ├───> [Respuesta CIVIS]:
       │     a) Acta Digitalizada disponible (PDF/Base64):
       │        -> Backend estampa firma electrónica criptográfica
       │        -> Aplica formato oficial CNE y código QR institucional
       │        -> Genera Acta Certificada final en PDF.
       │     b) Acta Física no digitalizada:
       │        -> Encola con TaskID en estado 'PENDIENTE DIGITALIZACION'.
       ▼
[Entrega / Descarga de Acta Certificada al Ciudadano]
```

---

### 10. DIAGNÓSTICO ACTUAL Y REQUERIMIENTOS PENDIENTES (OCTUBRE 2026)

#### 10.1. Módulo CompilaRC Desktop (Laptop / Taquilla): **100% OPERATIVO**
- Autonomía completa offline con base local SQLite de 36.6M registros en `C:\Compilarc\data\cedulados_full.db`.
- Lector biométrico Futronic FS88H integrado nativamente (500 DPI, compresión WSQ).
- Validación biométrica online contra el servicio central CNE/PIAC (`10.31.201.16:5080`).
- Bloqueo de pasos y validaciones de datos del solicitante y presentado con autocompletado reactivo.
- Indicadores informativos en cabecera y estética corporativa adaptada a Lenovo ThinkPad.

#### 10.2. Módulo CompilaRC Backend (Central / Web): **PUNTOS DE ACCIÓN REQUERIDOS**
1. **Renovación de API Key de CIVIS (Exclé):**
   - **Estado:** Vencido / Inactivo (`Code: 2005` / `Code: 2003`).
   - **Endpoint:** `https://10.21.101.9:7107/api/interop/special-certificate`
   - **Impacto:** Las solicitudes que viajan desde la desktop se registran con éxito en base de datos central, pero al consultar CIVIS son rechazadas por credencial expirada (`status HTTP 401: API Key está vencido`), quedando en estado preventivo `PENDIENTE DIGITALIZACION`.
   - **Acción:** Gestionar con el equipo de infraestructura de Exclé / CIVIS la emisión o reactivación de un nuevo `x-api-key`.
2. **Plantilla Gráfica Oficial del Nuevo Formato de Acta:**
   - **Estado:** Pendiente por entregar por las autoridades del CNE / Registro Civil.
   - **Módulo responsable:** `services/pdf_service.go` y `utils/certificacion.go`.
   - **Acción:** Tan pronto sea suministrado el diseño o modelo vectorial/PDF, se adaptarán las coordenadas, sellos de agua, tipografías y la disposición del código QR para la compilación final.
3. **Certificado Digital de Firma Electrónica Institucional:**
   - Ubicado en `certs/certificado.crt` y clave privada asociada para la firma PKCS#7 / PAdES. Verificar vigencia antes del corte a producción final.

