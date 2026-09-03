export function contarPendientes(grupos, respuestas) {
  return grupos.flatMap((grupo) => grupo.items)
    .filter((item) => !respuestas[item.id]).length;
}