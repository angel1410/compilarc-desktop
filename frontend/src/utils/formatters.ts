/**
 * Utilidades de sanitización y formateo con las reglas exactas de Registro Civil (CompilaRC)
 */

export const sanitizarTextoNombre = (val: string): string => {
  // Solo permite letras castellanas (con tildes, diéresis, ñ), apóstrofes y espacios
  return val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ' ]/g, '').toUpperCase();
};

export const sanitizarCedula = (val: string): string => {
  // Solo dígitos, máximo 9 caracteres
  return val.replace(/\D/g, '').slice(0, 9);
};

export const sanitizarSoloNumeros = (val: string, maxLen?: number): string => {
  const limpio = val.replace(/\D/g, '');
  return maxLen ? limpio.slice(0, maxLen) : limpio;
};

export const sanitizarCorreo = (val: string): string => {
  return val.toLowerCase().trim();
};

export const validarEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const esCampoNombre = (name: string): boolean => {
  return [
    'primer_nombre',
    'segundo_nombre',
    'primer_apellido',
    'segundo_apellido',
    'primer_nombre_el',
    'segundo_nombre_el',
    'primer_apellido_el',
    'segundo_apellido_el',
    'primer_nombre_ella',
    'segundo_nombre_ella',
    'primer_apellido_ella',
    'segundo_apellido_ella',
  ].includes(name);
};

export const getFechaHoy = (): string => {
  return new Date().toISOString().split('T')[0];
};
