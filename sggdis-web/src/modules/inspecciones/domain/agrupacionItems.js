// Junta los ítems en bloques según su artículo del reglamento. Como los ítems
// ya vienen ordenados, basta comparar cada uno con el último grupo abierto:
// si es del mismo artículo se agrega ahí, si no, se abre un grupo nuevo.
// Esto es lo que permite mostrar en el formulario los ítems agrupados visualmente
// bajo el mismo encabezado de artículo (ej. "Art. 23") en vez de uno por uno.
export function agruparPorArticulo(items = []) {
  return items.reduce((grupos, item) => {
    const ultimoGrupo = grupos[grupos.length - 1];
    if (!ultimoGrupo || ultimoGrupo.articulo !== item.articulo) {
      grupos.push({ articulo: item.articulo, items: [] });
    }

    const permiteNoAplica =
      item.permiteNoAplica === true ||
      item.permiteNoAplica === 'S' ||
      item.permiteNoAplica === 's';

    grupos[grupos.length - 1].items.push({
      id: item.idItem,
      texto: item.descripcion,
      valor: item.puntaje,
      critico: item.esCritico,
      noAplica: permiteNoAplica,
    });

    return grupos;
  }, []);
}