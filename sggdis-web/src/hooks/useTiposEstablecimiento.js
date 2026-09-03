import { useEffect, useState } from 'react';
import { obtenerTiposEstablecimiento } from '../services/guiasInspeccionService';

export function useTiposEstablecimiento(idGuia) {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    obtenerTiposEstablecimiento(idGuia)
      .then((datos) => {
        if (activo) {
          setError(null);
          setTipos(datos);
        }
      })
      .catch(() => {
        if (activo) setError('No se pudieron cargar los tipos de establecimiento.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, [idGuia]);

  return { tipos, cargando, error };
}