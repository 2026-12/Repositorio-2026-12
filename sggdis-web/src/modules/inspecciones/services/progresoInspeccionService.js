// Persiste el progreso de la inspección en curso para que no se pierda si se
// recarga la página o se pierde la conexión (requisito de uso sin conexión).
//
// HU-005I / hallazgo H4: antes se usaba una única clave fija para TODAS las
// inspecciones, así que si el inspector tenía dos inspecciones abiertas al
// mismo tiempo (dos pestañas, o iniciaba una nueva sin terminar la anterior),
// la segunda sobrescribía el progreso guardado de la primera. Ahora cada
// inspección guarda su progreso bajo una clave propia, formada con su
// idInspeccion, para que no se pisen entre sí.
const PREFIJO_CLAVE_PROGRESO = 'sggdis:inspeccion-en-curso';

// Clave aparte que recuerda cuál fue la última inspección activa en este
// navegador, para poder recuperarla automáticamente al volver a abrir la
// app sin necesidad de conocer de antemano su idInspeccion.
const CLAVE_INSPECCION_ACTIVA = 'sggdis:inspeccion-activa-id';

// Construye la clave específica de una inspección a partir de su idInspeccion.
function claveProgreso(idInspeccion) {
  return `${PREFIJO_CLAVE_PROGRESO}:${idInspeccion}`;
}

// Chequeo liviano para que el shell de la app decida la pantalla inicial
// sin tener que cargar (ni conocer la forma de) el progreso completo.
export function existeProgresoGuardado() {
  try {
    return Boolean(localStorage.getItem(CLAVE_INSPECCION_ACTIVA));
  } catch {
    return false;
  }
}

// Recupera el progreso guardado (si existe) al volver a abrir la app.
// Busca primero cuál fue la última inspección activa y luego carga su
// progreso específico (ya no hay una única clave compartida por todas).
export function cargarProgreso() {
  try {
    const idActivo = localStorage.getItem(CLAVE_INSPECCION_ACTIVA);
    if (!idActivo) return null;

    const guardado = localStorage.getItem(claveProgreso(idActivo));
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

// Guarda el progreso actual del formulario en el navegador, bajo la clave
// propia de esta inspección (según su idInspeccion), y actualiza cuál es
// la inspección activa.
export function guardarProgreso(progreso) {
  try {
    const idInspeccion = progreso?.datos?.idInspeccion;
    if (!idInspeccion) return;

    localStorage.setItem(claveProgreso(idInspeccion), JSON.stringify(progreso));
    localStorage.setItem(CLAVE_INSPECCION_ACTIVA, String(idInspeccion));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota llena, etc.): se ignora.
  }
}

// Borra el progreso guardado de una inspección (ej. cuando ya se cerró o se
// canceló). Si no se indica idInspeccion, borra la que estaba activa.
export function limpiarProgreso(idInspeccion) {
  try {
    const id = idInspeccion ?? localStorage.getItem(CLAVE_INSPECCION_ACTIVA);

    if (id) {
      localStorage.removeItem(claveProgreso(id));
    }

    localStorage.removeItem(CLAVE_INSPECCION_ACTIVA);
  } catch {
    // Ignorar si localStorage no está disponible.
  }
}
