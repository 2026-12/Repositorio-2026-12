// Resumen en vivo de una sección: puntos obtenidos y cuántos críticos están
// incumplidos. Alimenta el indicador de progreso y la alerta de crítico.
//
// El "máximo" que se muestra acá es siempre el nominal de la sección (la
// suma de todos sus ítems, tal como está en el catálogo): marcar un ítem
// como "N/A" no le resta puntos a este total, para no dar la impresión de
// que el establecimiento "perdió" puntos de la sección. La exclusión real
// de los ítems N/A para la nota final de la inspección se hace aparte, en
// cierreInspeccion.js (calcularPuntosExcluidosPorNoAplica /
// calcularPuntajeMaximoAjustado), que no depende de este máximo.
import { ESTADO_CUMPLE, ESTADO_NO_CUMPLE } from './opcionesRespuesta';

export function calcularResumen(grupos, respuestas) {
  return grupos.flatMap((grupo) => grupo.items).reduce((resumen, item) => {
    const respuesta = respuestas[item.id];
    resumen.maximo += item.valor;
    if (respuesta?.estado === ESTADO_CUMPLE) resumen.obtenidos += respuesta.puntos ?? 0;
    // Cuenta cuántos ítems críticos están marcados "No cumple" (dispara la advertencia).
    if (item.critico && respuesta?.estado === ESTADO_NO_CUMPLE) resumen.criticosIncumplidos += 1;
    return resumen;
  }, { obtenidos: 0, maximo: 0, criticosIncumplidos: 0 });
}