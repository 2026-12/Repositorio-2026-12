// Calcula cuántos ítems de una vista (pestaña principal) ya fueron respondidos,
// usando las secciones ya cacheadas (seccionesCache) para conocer su lista de ítems.
// Una vista compuesta (ej. "B") agrupa varias secciones reales (B1, B2, B3).
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
