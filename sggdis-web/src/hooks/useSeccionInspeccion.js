import { useEffect, useState } from 'react';
import { obtenerSeccion } from '../services/guiasInspeccionService';

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