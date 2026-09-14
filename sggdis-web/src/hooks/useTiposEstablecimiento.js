import { useEffect, useState } from 'react';
import { obtenerTiposEstablecimiento } from '../services/guiasInspeccionService';

// Hook que carga, apenas se monta el componente, la lista de tipos de
// establecimiento de una guía. Expone el resultado más un estado de "cargando"
// y de "error" para que el componente pueda mostrar el mensaje adecuado.
export function useTiposEstablecimiento(idGuia) {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // "activo" evita actualizar el estado si el componente ya se desmontó
    // antes de que termine la petición (evita el warning de React por eso).
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