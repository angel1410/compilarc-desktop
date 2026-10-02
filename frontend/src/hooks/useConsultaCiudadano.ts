import { useState, useEffect } from 'react';

export interface CiudadanoData {
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  fecha_nacimiento?: string;
  sexo?: 'F' | 'M' | '';
}

export interface OpcionesConsultaCiudadano {
  sexoEsperado?: 'F' | 'M' | '';
  rolNombre?: string;
}

export const useConsultaCiudadano = (
  nacionalidad: string,
  cedula: string | number,
  onAutocompletar: (datos: Partial<CiudadanoData>) => void,
  onLimpiar?: () => void,
  opciones?: OpcionesConsultaCiudadano
) => {
  const [cargando, setCargando] = useState<boolean>(false);
  const [bloqueado, setBloqueado] = useState<boolean>(false);
  const [errorSexo, setErrorSexo] = useState<string | null>(null);
  const [noEncontrado, setNoEncontrado] = useState<boolean>(false);

  useEffect(() => {
    const cedulaNum = Number(cedula);

    if (!nacionalidad || !cedulaNum || cedulaNum <= 0) {
      setBloqueado(false);
      setErrorSexo(null);
      setNoEncontrado(false);
      setCargando(false);
      if (onLimpiar) onLimpiar();
      return;
    }

    setBloqueado(false);
    setErrorSexo(null);
    setNoEncontrado(false);
    setCargando(true);

    const timer = setTimeout(async () => {
      try {
        let ciudadano: any = null;

        // 1. Si estamos ejecutando en Wails Desktop nativo, consultar backend Go directo (SQLite local <3ms)
        const wailsApp = (window as any).go?.main?.App;
        if (wailsApp && typeof wailsApp.ConsultarAC === 'function') {
          ciudadano = await wailsApp.ConsultarAC(nacionalidad, cedulaNum);
        } else {
          // 2. Si estamos en el navegador web (Vite dev server), consultar la API de desarrollo conectada al AC
          try {
            const resp = await fetch(`/api/ac/consultar?nacionalidad=${encodeURIComponent(nacionalidad)}&cedula=${cedulaNum}`);
            if (resp.ok) {
              ciudadano = await resp.json();
            }
          } catch (e) {
            console.warn('[AC Dev] Fallo al consultar API local:', e);
          }
        }

        if (ciudadano && ciudadano.primer_nombre) {
          const sexoObtenido = (ciudadano.sexo || '').toUpperCase().trim();
          const sexoEsperado = (opciones?.sexoEsperado || '').toUpperCase().trim();

          if (sexoEsperado && sexoObtenido && sexoObtenido !== sexoEsperado) {
            const descSexoObtenido = sexoObtenido === 'M' ? 'MASCULINO' : 'FEMENINO';
            const descSexoEsperado = sexoEsperado === 'M' ? 'MASCULINO' : 'FEMENINO';
            const rolTxt = opciones?.rolNombre || 'este campo';
            setErrorSexo(
              `La cédula ${nacionalidad}-${cedulaNum} pertenece a una persona de sexo ${descSexoObtenido} y no puede asignarse como ${rolTxt} (${descSexoEsperado}).`
            );
            setBloqueado(false);
            if (onLimpiar) onLimpiar();
            return;
          }

          onAutocompletar({
            primer_nombre: ciudadano.primer_nombre || '',
            segundo_nombre: ciudadano.segundo_nombre || '',
            primer_apellido: ciudadano.primer_apellido || '',
            segundo_apellido: ciudadano.segundo_apellido || '',
            fecha_nacimiento: ciudadano.fecha_nacimiento || '',
            sexo: ciudadano.sexo || '',
          });
          setBloqueado(true);
          setNoEncontrado(false);
        } else {
          // No está en el AC local: Cédula de reciente emisión
          setNoEncontrado(true);
          setBloqueado(false);
        }
      } catch (err) {
        console.error('Error consultando AC local:', err);
        setNoEncontrado(true);
        setBloqueado(false);
      } finally {
        setCargando(false);
      }
    }, 150); // Respuesta casi instantánea en desktop (150ms debounce)

    return () => clearTimeout(timer);
  }, [nacionalidad, cedula, opciones?.sexoEsperado, opciones?.rolNombre]);

  return { cargando, bloqueado, errorSexo, noEncontrado };
};
