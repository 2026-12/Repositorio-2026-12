export function agruparPorArticulo(items = []) {
  return items.reduce((grupos, item) => {
    const ultimoGrupo = grupos[grupos.length - 1];
    if (!ultimoGrupo || ultimoGrupo.articulo !== item.articulo) {
      grupos.push({ articulo: item.articulo, items: [] });
    }
    grupos[grupos.length - 1].items.push({
      id: item.idItem,
      texto: item.descripcion,
      valor: item.puntaje,
      critico: item.esCritico,
    });
    return grupos;
  }, []);
}