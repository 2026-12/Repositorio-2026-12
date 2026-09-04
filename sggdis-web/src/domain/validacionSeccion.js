export function contarPendientes(grupos, respuestas) {
  return grupos.flatMap((grupo) => grupo.items)
    .filter((item) => !respuestas[item.id]).length;
}

// Devuelve el detalle (artículo + texto) de cada ítem sin responder, para poder
// indicarle al usuario exactamente cuáles le faltan por completar.
export function obtenerPendientes(grupos, respuestas) {
  return grupos.flatMap((grupo) => grupo.items.map((item) => ({ ...item, articulo: grupo.articulo })))
    .filter((item) => !respuestas[item.id]);
}