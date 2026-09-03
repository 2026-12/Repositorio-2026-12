export function calcularResumen(grupos, respuestas) {
  return grupos.flatMap((grupo) => grupo.items).reduce((resumen, item) => {
    const respuesta = respuestas[item.id];
    if (respuesta?.estado !== 'N/A') resumen.maximo += item.valor;
    if (respuesta?.estado === 'Cumple') resumen.obtenidos += respuesta.puntos ?? 0;
    if (item.critico && respuesta?.estado === 'No cumple') resumen.criticosIncumplidos += 1;
    return resumen;
  }, { obtenidos: 0, maximo: 0, criticosIncumplidos: 0 });
}