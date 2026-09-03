import { useMemo, useState } from 'react';
import { calcularResumen } from '../domain/calculoPuntaje';

export function useRespuestasInspeccion(grupos, respuestasControladas, onRespuestasChange) {
  const [respuestasLocales, setRespuestasLocales] = useState({});
  const respuestas = respuestasControladas ?? respuestasLocales;

  function actualizarRespuestas(actualizar) {
    if (onRespuestasChange) {
      onRespuestasChange(typeof actualizar === 'function' ? actualizar(respuestas) : actualizar);
    } else {
      setRespuestasLocales(actualizar);
    }
  }

  function alternarRespuesta(itemId, estado, puntosMaximos) {
    actualizarRespuestas((actuales) => {
      if (actuales[itemId]?.estado === estado) {
        const siguientes = { ...actuales };
        delete siguientes[itemId];
        return siguientes;
      }
      return {
        ...actuales,
        [itemId]: { estado, puntos: estado === 'Cumple' ? puntosMaximos : 0 },
      };
    });
  }

  function actualizarPuntos(itemId, puntos) {
    actualizarRespuestas((actuales) => ({
      ...actuales,
      [itemId]: { ...actuales[itemId], puntos },
    }));
  }

  const resumen = useMemo(() => calcularResumen(grupos, respuestas), [grupos, respuestas]);
  return { respuestas, alternarRespuesta, actualizarPuntos, resumen };
}
