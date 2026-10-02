export interface DatosSolicitante {
  parentesco: string;
  nacionalidad: 'V' | 'E' | 'P' | 'O' | '';
  cedula: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  correo: string;
  sexo?: 'F' | 'M' | '';
  fe_nacimiento?: string;
}

export interface DatosPresentado {
  fecha_nacimiento: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  pais_nacimiento?: string;
  estado?: string;
  municipio?: string;
  parroquia?: string;
  sexo: 'F' | 'M' | '';
  centro_salud: string;
  filiacion?: string;
  estado_id?: string;
  municipio_id?: string;
  parroquia_id?: string;
}

export interface DatosPadre {
  nacionalidad: 'V' | 'E' | 'P' | 'O' | '';
  cedula: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
}

export interface DatosMadre {
  nacionalidad: 'V' | 'E' | 'P' | 'O' | '';
  cedula: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
}

export interface DatosActa {
  dia: string;
  mes: string;
  anio: string;
  tomo: string;
  folio?: string;
  co_acta: string;
}

export interface DatosOficina {
  estado_id: string;
  municipio_id: string;
  parroquia_id: string;
  ourc_id: string;
}

export interface DatosConyugues {
  fecha_acto: string;
  // Ella
  nacionalidad_ella: string;
  cedula_ella: string;
  primer_nombre_ella: string;
  segundo_nombre_ella?: string;
  primer_apellido_ella: string;
  segundo_apellido_ella?: string;
  correo_ella?: string;
  // Él
  nacionalidad_el: string;
  cedula_el: string;
  primer_nombre_el: string;
  segundo_nombre_el?: string;
  primer_apellido_el: string;
  segundo_apellido_el?: string;
  correo_el?: string;
}

export interface DatosFallecido {
  fecha_defuncion: string;
  nacionalidad: 'V' | 'E' | 'P' | 'O' | '';
  cedula: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  sexo: 'F' | 'M' | '';
  filiacion?: string;
}