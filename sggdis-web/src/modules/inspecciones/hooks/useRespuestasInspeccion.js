import { useMemo, useState } from 'react';
import { calcularResumen } from '../domain/calculoPuntaje';

// Maneja las respuestas del checklist de una sección: marcar/desmarcar un
// ítem, ajustar puntos, y recalcular el resumen cada vez que cambian.
//
// Si el padre pasa respuestasControladas + onRespuestasChange, el estado
// vive en el padre. Si no, el hook lo maneja solo (respuestasLocales).
export function useRespuestasInspeccion(grupos, respuestasControladas, onRespuestasChange) {
  const [respuestasLocales, setRespuestasLocales] = useState({});
  const respuestas = respuestasControladas ?? respuestasLocales;

  // Aplica un cambio de respuestas, ya sea notificando al padre (modo controlado)
  // o actualizando el estado local (modo no controlado).
  function actualizarRespuestas(actualizar) {
    if (onRespuestasChange) {
      onRespuestasChange(typeof actualizar === 'function' ? actualizar(respuestas) : actualizar);
    } else {
      setRespuestasLocales(actualizar);
    }
  }

  // Marca un ítem con un estado. Si ya tenía ese mismo estado, lo desmarca.
  function alternarRespuesta(itemId, estado, puntosMaximos) {
    actualizarRespuestas((actuales) => {
      if (actuales[itemId]?.estado === estado) {
        const siguientes = { ...actuales };
        delete siguientes[itemId];
        return siguientes;
      }

      return {
        ...actuales,
        [itemId]: {
          estado,
          puntos: estado === 'Cumple' ? puntosMaximos : 0,
        },
      };
    });
  }

  // Cambia solo el puntaje otorgado a un ítem ya marcado (para puntaje parcial).
  function actualizarPuntos(itemId, puntos) {
    const item = grupos
      .flatMap((grupo) => grupo.items)
      .find((itemActual) => itemActual.id === itemId);

    if (!item) return;

    const valorMaximo = Number(item.valor) || 1;
    const valorSeleccionado = Number(puntos) || 1;
    const puntosAjustados = Math.min(
      Math.max(1, valorSeleccionado),
      valorMaximo
    );

    actualizarRespuestas((actuales) => ({
      ...actuales,
      [itemId]: {
        ...actuales[itemId],
        puntos: puntosAjustados,
      },
    }));
  }

  // Recalcula el resumen solo cuando cambian ítems o respuestas.
  const resumen = useMemo(() => calcularResumen(grupos, respuestas), [grupos, respuestas]);
  return { respuestas, alternarRespuesta, actualizarPuntos, resumen };
}