import { useEffect, useState } from 'react';
import { obtenerGuias } from '../services/actaGeneralService';

// Carga, apenas se monta el componente, el catálogo de guías de inspección
// (INS_GUIA). Mismo patrón que useTiposEstablecimiento: expone el resultado
// más un estado de "cargando" y de "error" para mostrar el mensaje adecuado.
export function useGuiasInspeccion() {
  const [guias, setGuias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // "activo" evita actualizar el estado si el componente ya se desmontó
    // antes de que termine la petición.
    let activo = true;
    obtenerGuias()
      .then((datos) => {
        if (activo) {
          setError(null);
          setGuias(datos);
        }
      })
      .catch(() => {
        if (activo) setError('No se pudieron cargar las guías de inspección.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, []);

  return { guias, cargando, error };
}
