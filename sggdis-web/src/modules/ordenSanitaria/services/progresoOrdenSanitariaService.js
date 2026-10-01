// Guarda el progreso de una Orden Sanitaria en localStorage para que no
// se pierda si se recarga la página.
//
// Igual que el módulo de inspecciones, cada Orden Sanitaria utiliza una
// clave diferente según el idInspeccion relacionado. De esta manera,
// el progreso no se mezcla entre diferentes inspecciones.
const PREFIJO_CLAVE_PROGRESO =
  'sggdis:orden-sanitaria-en-curso';

// Clave aparte que indica cuál es la Orden Sanitaria activa.
const CLAVE_ORDEN_ACTIVA =
  'sggdis:orden-sanitaria-activa-id';

// Construye la clave específica según la inspección relacionada.
function claveProgreso(idInspeccion) {
  return `${PREFIJO_CLAVE_PROGRESO}:${idInspeccion}`;
}

// Permite que App.jsx sepa si existe una Orden Sanitaria pendiente.
export function existeProgresoOrdenSanitaria() {
  try {
    return Boolean(
      localStorage.getItem(
        CLAVE_ORDEN_ACTIVA
      )
    );
  } catch {
    return false;
  }
}

// Recupera el progreso de la última Orden Sanitaria activa.
export function cargarProgresoOrdenSanitaria() {
  try {
    const idActivo =
      localStorage.getItem(
        CLAVE_ORDEN_ACTIVA
      );

    if (!idActivo) {
      return null;
    }

    const guardado =
      localStorage.getItem(
        claveProgreso(
          idActivo
        )
      );

    return guardado
      ? JSON.parse(
          guardado
        )
      : null;
  } catch {
    return null;
  }
}

// Guarda automáticamente el progreso de la Orden Sanitaria.
export function guardarProgresoOrdenSanitaria(progreso) {
  try {
    const idInspeccion =
      progreso?.datos?.idInspeccion;

    if (!idInspeccion) {
      return;
    }

    localStorage.setItem(
      claveProgreso(
        idInspeccion
      ),
      JSON.stringify(
        progreso
      )
    );

    localStorage.setItem(
      CLAVE_ORDEN_ACTIVA,
      String(
        idInspeccion
      )
    );
  } catch {
    // Si localStorage no está disponible, simplemente se ignora.
  }
}

// Elimina el progreso de una Orden Sanitaria.
//
// Si no se indica idInspeccion, elimina la Orden que estaba marcada
// como activa.
export function limpiarProgresoOrdenSanitaria(idInspeccion) {
  try {
    const id =
      idInspeccion ??
      localStorage.getItem(
        CLAVE_ORDEN_ACTIVA
      );

    if (id) {
      localStorage.removeItem(
        claveProgreso(
          id
        )
      );
    }

    localStorage.removeItem(
      CLAVE_ORDEN_ACTIVA
    );
  } catch {
    // Si localStorage no está disponible, simplemente se ignora.
  }
}