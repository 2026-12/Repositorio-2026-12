// Cuenta cuántos ítems de una vista (pestaña) ya fueron respondidos, usando
// seccionesCache para saber qué ítems tiene. Una vista compuesta como "B"
// agrupa varias secciones reales (B1, B2, B3).
export function contarProgresoVista(vista, seccionesCache = {}, respuestas = {}) {
  let total = 0;
  let contestados = 0;
  (vista?.secciones ?? []).forEach((seccionRaw) => {
    const seccionCacheada = seccionesCache[seccionRaw.codigo];
    if (!seccionCacheada) return;
    seccionCacheada.items.forEach((item) => {
      total++;
      if (respuestas[item.idItem]) contestados++;
    });
  });
  return { total, contestados };
}

// Una vista se considera completa solo si ya se cargó (tiene ítems conocidos)
// y todos sus ítems tienen respuesta registrada.
export function esVistaCompleta(vista, seccionesCache = {}, respuestas = {}) {
  const { total, contestados } = contarProgresoVista(vista, seccionesCache, respuestas);
  return total > 0 && contestados === total;
}

// Evalúa si una sección (grupos de ítems ya cargados) está completa: solo cuentan
// los ítems no opcionales. Si no hay ninguno requerido, se considera completa.
export function evaluarCompletitudSeccion(grupos, respuestas = {}) {
  const itemsRequeridos = grupos.flatMap((grupo) => grupo.items).filter((item) => !item.opcional);

  if (itemsRequeridos.length === 0) {
    return { completa: true, vacia: true };
  }

  const tieneRespuestas = itemsRequeridos.some((item) => Boolean(respuestas[item.id]?.estado));
  const todosRespondidos = itemsRequeridos.every((item) => Boolean(respuestas[item.id]?.estado));

  return { completa: todosRespondidos, vacia: !tieneRespuestas };
}
