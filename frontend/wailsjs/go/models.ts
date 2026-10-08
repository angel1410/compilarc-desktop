export namespace ac {
	
	export class Ciudadano {
	    nacionalidad: string;
	    cedula: number;
	    primer_nombre: string;
	    segundo_nombre: string;
	    primer_apellido: string;
	    segundo_apellido: string;
	    fecha_nacimiento: string;
	    sexo: string;
	
	    static createFrom(source: any = {}) {
	        return new Ciudadano(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nacionalidad = source["nacionalidad"];
	        this.cedula = source["cedula"];
	        this.primer_nombre = source["primer_nombre"];
	        this.segundo_nombre = source["segundo_nombre"];
	        this.primer_apellido = source["primer_apellido"];
	        this.segundo_apellido = source["segundo_apellido"];
	        this.fecha_nacimiento = source["fecha_nacimiento"];
	        this.sexo = source["sexo"];
	    }
	}

}

export namespace biometric {
	
	export class EstadoSensor {
	    conectado: boolean;
	    nombre_modelo: string;
	    numero_serie: string;
	    version_firmware: string;
	    soporta_lfd: boolean;
	    modo_simulado_dev: boolean;
	
	    static createFrom(source: any = {}) {
	        return new EstadoSensor(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.conectado = source["conectado"];
	        this.nombre_modelo = source["nombre_modelo"];
	        this.numero_serie = source["numero_serie"];
	        this.version_firmware = source["version_firmware"];
	        this.soporta_lfd = source["soporta_lfd"];
	        this.modo_simulado_dev = source["modo_simulado_dev"];
	    }
	}
	export class ResultadoHuella {
	    capturado: boolean;
	    calidad: number;
	    lfd_detectado: boolean;
	    template_minucias_b64: string;
	    sample_wsq: string;
	    imagen_preview_b64: string;
	    dedo_nombre: string;
	    dedo: string;
	    dispositivo_nombre: string;
	    timestamp: string;
	
	    static createFrom(source: any = {}) {
	        return new ResultadoHuella(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.capturado = source["capturado"];
	        this.calidad = source["calidad"];
	        this.lfd_detectado = source["lfd_detectado"];
	        this.template_minucias_b64 = source["template_minucias_b64"];
	        this.sample_wsq = source["sample_wsq"];
	        this.imagen_preview_b64 = source["imagen_preview_b64"];
	        this.dedo_nombre = source["dedo_nombre"];
	        this.dedo = source["dedo"];
	        this.dispositivo_nombre = source["dispositivo_nombre"];
	        this.timestamp = source["timestamp"];
	    }
	}

}

export namespace main {
	
	export class ResultadoGuardarSolicitud {
	    id: string;
	    transmitido: boolean;
	    modo: string;
	    co_solicitud?: number;
	    mensaje: string;
	
	    static createFrom(source: any = {}) {
	        return new ResultadoGuardarSolicitud(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.transmitido = source["transmitido"];
	        this.modo = source["modo"];
	        this.co_solicitud = source["co_solicitud"];
	        this.mensaje = source["mensaje"];
	    }
	}

}

export namespace network {
	
	export class EstadoRed {
	    online: boolean;
	    tipo_conexion: string;
	    nombre_interfaz: string;
	    ip_local: string;
	    gateway: string;
	    tiene_internet: boolean;
	    latencia_ms: number;
	    mensaje: string;
	    ultima_revision: string;
	
	    static createFrom(source: any = {}) {
	        return new EstadoRed(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.online = source["online"];
	        this.tipo_conexion = source["tipo_conexion"];
	        this.nombre_interfaz = source["nombre_interfaz"];
	        this.ip_local = source["ip_local"];
	        this.gateway = source["gateway"];
	        this.tiene_internet = source["tiene_internet"];
	        this.latencia_ms = source["latencia_ms"];
	        this.mensaje = source["mensaje"];
	        this.ultima_revision = source["ultima_revision"];
	    }
	}

}

export namespace storage {
	
	export class SolicitudCertificacion {
	    id: string;
	    tipo_acta: string;
	    operador: string;
	    cedula_verificacion_central: boolean;
	    datos_solicitante: Record<string, any>;
	    datos_acta: Record<string, any>;
	    datos_biometricos: Record<string, any>;
	    estado: string;
	    creado_en: string;
	
	    static createFrom(source: any = {}) {
	        return new SolicitudCertificacion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.tipo_acta = source["tipo_acta"];
	        this.operador = source["operador"];
	        this.cedula_verificacion_central = source["cedula_verificacion_central"];
	        this.datos_solicitante = source["datos_solicitante"];
	        this.datos_acta = source["datos_acta"];
	        this.datos_biometricos = source["datos_biometricos"];
	        this.estado = source["estado"];
	        this.creado_en = source["creado_en"];
	    }
	}

}

