# INFORME TÉCNICO DE ESTATUS OPERATIVO E INTEGRACIÓN
## Proyecto CompilARC: Sistema Integrado de Registro Civil y Certificación Digital

**Fecha:** 8 de octubre de 2026  
**Dirigido a:** Coordinación de Tecnología / Comisión Nacional de Registro Civil y Electoral (CNE)  
**Elaborado por:** Equipo de Desarrollo e Integración CompilARC  
**Asunto:** Estatus Operativo de CompilaRC Desktop (Estaciones de Taquilla), Diagnóstico de Conectividad e Interoperabilidad CIVIS (Exclé) y Requerimientos Pendientes en Backend Central.

---

### 1. RESUMEN EJECUTIVO

El presente informe detalla el estado técnico y operativo actual de la solución **CompilARC** en sus dos componentes principales:
1. **CompilaRC Desktop (Cliente de Taquilla / Laptop):** Se encuentra en estado **100% OPERATIVO**. Cuenta con despliegue autónomo, padrón de Archivo Cedulado completo (36.6 millones de registros en SQLite local), captura óptica de alta fidelidad con sensor Futronic FS88H (500 DPI / WSQ), integración biométrica con PIAC/CNE y control estricto de flujos de validación.
2. **CompilaRC Backend (Servidor Central / Web):** La infraestructura central se encuentra operativa, enrutando solicitudes y gestionando la base de datos PostgreSQL. No obstante, **el flujo de recuperación automática de actas digitalizadas y emisión certificada se encuentra temporalmente detenido por dos factores externos**:
   - **Expiración de la API Key de CIVIS (Exclé):** Las solicitudes de consulta dirigidas al servicio `https://10.21.101.9:7107` son rechazadas con error HTTP 401 (`Código 2005: API Key está vencido` / `Código 2003: API Key inválido`).
   - **Plantilla Oficial del Nuevo Formato de Acta:** Pendiente por suministrar por las autoridades institucionales para parametrizar el generador de PDF, sellos y firma digital.

---

### 2. CONFIRMACIÓN DEL FLUJO Y ARQUITECTURA DE CERTIFICACIÓN

Se confirma que el modelo de arquitectura e interoperabilidad implementado opera bajo el siguiente esquema:

```
┌────────────────────────────────────────────────────────┐
│             ESTACIÓN DE TAQUILLA (DESKTOP)             │
│                                                        │
│ 1. Consulta Cédula en AC Local (36.6M SQLite)          │
│ 2. Captura Dactilar FS88H (WSQ 500 DPI)                │
│ 3. Verificación en Vivo ante CNE / PIAC (10.31.201.16) │
│ 4. Recopilación de Parámetros del Acta                 │
└──────────────────────────┬─────────────────────────────┘
                           │
                           │ POST /api/v1/desktop/solicitudes
                           ▼
┌────────────────────────────────────────────────────────┐
│             COMPILARC BACKEND (CENTRAL / WEB)          │
│                                                        │
│ 5. Registro transaccional en PostgreSQL (c003t)        │
│ 6. Consulta directa hacia CIVIS (Exclé)                │
└──────────────────────────┬─────────────────────────────┘
                           │
                           │ POST https://10.21.101.9:7107/api/interop/special-certificate
                           ▼
┌────────────────────────────────────────────────────────┐
│                   PLATAFORMA CIVIS                     │
│                                                        │
│ ¿Acta digitalizada existente?                          │
│   ├── SI ──> Devuelve imagen / PDF / metadatos         │
│   └── NO ──> Encola tarea física (TaskID)              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            GENERACIÓN DE COPIA CERTIFICADA             │
│                                                        │
│ 7. CompilaRC Backend ensambla:                         │
│    - Imagen digitalizada del acta recuperada           │
│    - Nuevo formato y cintillos institucionales CNE     │
│    - Código QR de validación criptográfica             │
│    - Certificado y firma electrónica institucional     │
│ 8. Emisión de Acta Certificada en PDF final            │
└────────────────────────────────────────────────────────┘
```

**Conclusión del Flujo:** El entendimiento del proceso es **exacto**. La aplicación de escritorio no contacta a CIVIS directamente por razones de seguridad perimetral y centralización de auditoría; delega la petición al Backend Central, el cual consulta a CIVIS, recibe los datos y compila el documento oficial certificado.

---

### 3. ESTATUS OPERATIVO: COMPILARC DESKTOP (TAQUILLA)

La versión de escritorio instalada y disponible en el portal de distribución (`http://192.168.213.42:9090`) presenta un cumplimiento del 100% en las especificaciones acordadas:

| Componente / Característica | Estado | Detalle Técnico |
| :--- | :---: | :--- |
| **Padrón Local AC Completo** | **OPERATIVO** | 36,604,025 ciudadanos (V y E) en `C:\Compilarc\data\cedulados_full.db`. Respuestas en <1 ms sin internet. |
| **Catálogos Oficiales** | **OPERATIVO** | Estados, Municipios, Parroquias (1,906 registros) y Oficinas de Registro (1,245 registros). |
| **Hardware Futronic FS88H** | **OPERATIVO** | Enlace nativo x64 mediante `ftrScanAPI.dll`. Muestreo óptico de 500 DPI. |
| **Compresión de Imagen WSQ** | **OPERATIVO** | Motor integrado Go (`go-wsq`) a 0.75 bitrate bajo estándar NIST/FBI. Sin dependencias externas. |
| **Biometría CNE PIAC** | **OPERATIVO** | Enlace transaccional en dos fases (`/begin` y `/verify`) contra AFIS del CNE con score $\ge 40$. |
| **Bloqueo Reactivo de Flujos** | **OPERATIVO** | Pasos 2 y 3 inhabilitados hasta que el solicitante esté validado en AC Y con biometría conforme. |
| **Autocompletado de Titular** | **OPERATIVO** | Selección "YO" rellena presentado automáticamente; modificación de cédula resetea dependientes. |
| **Dedos Normativos CNE** | **OPERATIVO** | Restringido estrictamente a 4 dedos: Pulgares e Índices derechos e izquierdos (dedo medio removido). |
| **Indicadores y Ergonomía** | **OPERATIVO** | Indicadores informativos en caja redondeada blanca; notificaciones translúcidas con desenfoque; ícono con base clara y fondo Lenovo corporativo ThinkPad. |

---

### 4. DIAGNÓSTICO TÉCNICO: SERVICIO CIVIS (EXCLÉ) Y API KEY

Se realizaron pruebas de diagnóstico exhaustivas de conectividad y autenticación hacia el endpoint de interoperabilidad de CIVIS:

* **URL del Endpoint:** `https://10.21.101.9:7107/api/interop/special-certificate`
* **API Key Configurado:** `P!Y2lFcqAiV1E][p]`
* **Cabecera HTTP:** `x-api-key`

#### 4.1. Diagnóstico de Red y Transporte (Capa 3, 4 y 7)
* **Conectividad IP:** **EXITOSA**. El servidor responde en la dirección `10.21.101.9` puerto `7107`.
* **Negociación TLS/SSL:** **EXITOSA**. El certificado del servidor Kestrel (.NET) es aceptado.
* **Disponibilidad del Servicio:** **ACTIVO**. El servicio web de CIVIS se encuentra en ejecución.

#### 4.2. Diagnóstico de Autenticación y Autorización (Capa de Aplicación)
Al enviar una solicitud formal de certificación al endpoint con el API Key provisto, el servidor CIVIS responde:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
Server: Kestrel

{
  "Status": "fail",
  "Data": null,
  "Message": "API Key está vencido.",
  "Code": 2005
}
```
*(En consultas con variaciones del DTO el servidor también arroja `Code: 2003: API Key inválido`).*

#### 4.3. Evidencia en Logs de CompilaRC Backend
En los registros históricos y en tiempo real del backend se constata la recurrencia de este rechazo:
```log
2026/10/06 16:51:39 desktop_handler.go:262: [DESKTOP -> CIVIS DIRECTO] Solicitud #5860 no localizada de inmediato en CIVIS. Encolada para digitalización: CIVIS respondió status HTTP 401: {"Status":"fail","Data":null,"Message":"API Key está vencido.","Code":2005}
```

**Dictamen:** El API Key `P!Y2lFcqAiV1E][p]` **ha caducado en la base de datos de autorización de CIVIS**. Toda petición enviada por CompilaRC es interceptada y rechazada por el middleware de seguridad de CIVIS, impidiendo la recuperación de actas digitalizadas.

---

### 5. PUNTOS PENDIENTES EN COMPILARC BACKEND (CENTRAL)

Para completar el ciclo productivo de certificación, se requiere atender los siguientes ítems en el Servidor Central:

#### 1. Renovación Inmediata de API Key de CIVIS
* **Requerimiento:** Solicitar al equipo técnico de **Exclé / CIVIS** la generación y entrega de un nuevo API Key activo para el ambiente de interoperabilidad de actas especiales (`/api/interop/special-certificate`).
* **Configuración en Backend:** Una vez suministrada, se actualizará la variable `CIVIS_API_KEY` en el archivo `.env` del servidor central y se reiniciará el servicio sin requerir cambios de código fuente.

#### 2. Suministro del Nuevo Formato Gráfico Oficial del Acta Certificada
* **Requerimiento:** Entrega formal por parte del CNE / Registro Civil del modelo definitivo (maqueta gráfica, PDF muestra o especificación vectorial) del nuevo formato de Acta Certificada.
* **Componentes a Implementar:**
  - Posicionamiento exacto de cintillos republicanos e institucionales.
  - Maquetación de la imagen del acta original recuperada desde CIVIS.
  - Dimensiones y ubicación del código QR de validación en línea.
  - Textos reglamentarios de certificación, resolución del Director General y sellos institucionales.

#### 3. Validación del Certificado Digital Institucional de Firma Electrónica
* **Requerimiento:** Verificar la vigencia del par de claves y certificado X.509 (`certs/certificado.crt`) utilizado por el backend para el firmado criptográfico de los documentos PDF emitidos.

---

### 6. PLAN DE ACCIÓN Y RECOMENDACIONES

1. **Gestión Administrativa / Técnica con Exclé:**
   Enviar solicitud formal al administrador del sistema CIVIS indicando:
   - IP origen del servidor CompilaRC: `192.168.213.42` (o IP pública/VPN autorizada).
   - Servicio requerido: `POST /api/interop/special-certificate`.
   - Motivo: Renovación por expiración de credencial anterior (`Code 2005`).
2. **Recepción del Modelo de Acta:**
   Concretar con la Oficina Nacional de Registro Civil la entrega del diseño oficial de la certificación para proceder a su codificación inmediata en `services/pdf_service.go` y `utils/certificacion.go`.
3. **Pruebas Integrales de Certificación:**
   Una vez actualizado el API Key y cargada la plantilla oficial, realizar una prueba de punta a punta: desde la captura en la laptop de taquilla con huella dactilar, pasando por la recuperación en CIVIS, hasta la impresión del acta final con su código QR validable en el portal web.
