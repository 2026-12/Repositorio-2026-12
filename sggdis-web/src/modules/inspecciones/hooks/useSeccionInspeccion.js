import { useEffect, useState } from 'react';
import { obtenerSeccion } from '../services/guiasInspeccionService';

// Hook que carga una sección específica (con sus ítems) cada vez que cambia
// el código de sección o el tipo de establecimiento. Se usa dentro de cada
// FormularioSeccionX para traer los datos que le corresponden.
export function useSeccionInspeccion(idGuia, codigo, idTipoEstablecimiento = null) {
  const [seccion, setSeccion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    if (!codigo) {
      return () => { activo = false; };
    }

    obtenerSeccion(idGuia, codigo, idTipoEstablecimiento)
      .then((datos) => {
        if (activo) {
          setError(null);
          setSeccion(datos);
        }
      })
      .catch(() => {
        if (activo) setError(`No se pudo cargar la sección ${codigo}.`);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, [idGuia, codigo, idTipoEstablecimiento]);

  return { seccion, cargando, error };
}