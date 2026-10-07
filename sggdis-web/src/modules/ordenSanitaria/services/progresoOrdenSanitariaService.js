// Guarda el progreso de una Orden Sanitaria en localStorage para que no
// se pierda si se recarga la página.
//
// Cada Orden Sanitaria usa una clave propia según el idInspeccion
// relacionado (sggdis:orden-sanitaria-en-curso:<idInspeccion>), de modo que
// el progreso de una inspección nunca se mezcla con el de otra (EH5-05).
//
// Además se guarda cuál es la Orden Sanitaria activa
// (sggdis:orden-sanitaria-activa-id). Esa clave solo se usa para:
//   1. Que routing.jsx sepa si hay una Orden Sanitaria pendiente.
//   2. Retomar la orden al recargar la página, cuando el idInspeccion ya no
//      llega por location.state.
// Cuando sí se conoce el idInspeccion, siempre se carga el progreso de ESA
// inspección y nunca el de la orden activa.

const PREFIJO_CLAVE_PROGRESO = 'sggdis:orden-sanitaria-en-curso';

const CLAVE_ORDEN_ACTIVA = 'sggdis:orden-sanitaria-activa-id';

/**
 * Construye la clave de localStorage para una inspección.
 * @param {number|string} idInspeccion
 * @returns {string}
 */
function construirClaveProgreso(idInspeccion) {
  return `${PREFIJO_CLAVE_PROGRESO}:${idInspeccion}`;
}

/**
 * Indica si un idInspeccion tiene un valor utilizable.
 * @param {number|string|null|undefined} idInspeccion
 * @returns {boolean}
 */
function esIdInspeccionValido(idInspeccion) {
  return idInspeccion !== null && idInspeccion !== undefined && String(idInspeccion).trim() !== '';
}

/**
 * Lee y convierte el progreso guardado de una inspección.
 * Descarta el registro si pertenece a otra inspección o está dañado.
 * @param {number|string} idInspeccion
 * @returns {object|null}
 */
function leerProgresoPorInspeccion(idInspeccion) {
  const guardado = localStorage.getItem(construirClaveProgreso(idInspeccion));

  if (!guardado) return null;

  const progreso = JSON.parse(guardado);

  // Defensa adicional: el registro debe corresponder a la inspección pedida.
  if (String(progreso?.datos?.idInspeccion) !== String(idInspeccion)) {
    return null;
  }

  return progreso;
}

/**
 * Permite que routing.jsx sepa si existe una Orden Sanitaria pendiente.
 * @returns {boolean}
 */
export function existeProgresoOrdenSanitaria() {
  try {
    return Boolean(localStorage.getItem(CLAVE_ORDEN_ACTIVA));
  } catch {
    return false;
  }
}

/**
 * Recupera el progreso de la Orden Sanitaria de una inspección.
 *
 * - Con idInspeccion: devuelve solo el progreso de esa inspección (o null).
 * - Sin idInspeccion (por ejemplo, al recargar la página): devuelve el
 *   progreso de la Orden Sanitaria activa.
 *
 * @param {number|string} [idInspeccion] Inspección relacionada.
 * @returns {object|null} Progreso guardado o null si no existe.
 */
export function cargarProgresoOrdenSanitaria(idInspeccion) {
  try {
    const idBuscado = esIdInspeccionValido(idInspeccion)
      ? idInspeccion
      : localStorage.getItem(CLAVE_ORDEN_ACTIVA);

    if (!esIdInspeccionValido(idBuscado)) return null;

    return leerProgresoPorInspeccion(idBuscado);
  } catch {
    return null;
  }
}

/**
 * Guarda automáticamente el progreso de la Orden Sanitaria y la marca como
 * la orden activa.
 * @param {object} progreso Debe incluir datos.idInspeccion.
 */
export function guardarProgresoOrdenSanitaria(progreso) {
  try {
    const idInspeccion = progreso?.datos?.idInspeccion;

    if (!esIdInspeccionValido(idInspeccion)) return;

    localStorage.setItem(construirClaveProgreso(idInspeccion), JSON.stringify(progreso));
    localStorage.setItem(CLAVE_ORDEN_ACTIVA, String(idInspeccion));
  } catch {
    // Si localStorage no está disponible, simplemente se ignora.
  }
}

/**
 * Elimina el progreso de una Orden Sanitaria.
 *
 * Solo quita la marca de "orden activa" si corresponde a la misma
 * inspección, para no perder la referencia a otra orden pendiente.
 * Si no se indica idInspeccion, elimina la orden marcada como activa.
 *
 * @param {number|string} [idInspeccion] Inspección cuya orden se descarta.
 */
export function limpiarProgresoOrdenSanitaria(idInspeccion) {
  try {
    const idActivo = localStorage.getItem(CLAVE_ORDEN_ACTIVA);
    const idAEliminar = esIdInspeccionValido(idInspeccion) ? idInspeccion : idActivo;

    if (!esIdInspeccionValido(idAEliminar)) return;

    localStorage.removeItem(construirClaveProgreso(idAEliminar));

    if (String(idActivo) === String(idAEliminar)) {
      localStorage.removeItem(CLAVE_ORDEN_ACTIVA);
    }
  } catch {
    // Si localStorage no está disponible, simplemente se ignora.
  }
}