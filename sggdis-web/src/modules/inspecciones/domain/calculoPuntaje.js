// Resumen en vivo de una sección: puntos obtenidos, máximo (sin contar los
// ítems en N/A) y cuántos críticos están incumplidos. Alimenta el indicador
// de progreso y la alerta de crítico.
export function calcularResumen(grupos, respuestas) {
  return grupos.flatMap((grupo) => grupo.items).reduce((resumen, item) => {
    const respuesta = respuestas[item.id];
    // Un ítem "N/A" no cuenta ni para lo obtenido ni para el máximo posible.
    if (respuesta?.estado !== 'N/A') resumen.maximo += item.valor;
    if (respuesta?.estado === 'Cumple') resumen.obtenidos += respuesta.puntos ?? 0;
    // Cuenta cuántos ítems críticos están marcados "No cumple" (dispara la advertencia).
    if (item.critico && respuesta?.estado === 'No cumple') resumen.criticosIncumplidos += 1;
    return resumen;
  }, { obtenidos: 0, maximo: 0, criticosIncumplidos: 0 });
}