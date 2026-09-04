// Persiste el progreso de la inspección en curso para que no se pierda si se
// recarga la página o se pierde la conexión (requisito de uso sin conexión).
const CLAVE_PROGRESO = 'sggdis:inspeccion-en-curso';

export function cargarProgreso() {
  try {
    const guardado = localStorage.getItem(CLAVE_PROGRESO);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function guardarProgreso(progreso) {
  try {
    localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(progreso));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota llena, etc.): se ignora.
  }
}

export function limpiarProgreso() {
  try {
    localStorage.removeItem(CLAVE_PROGRESO);
  } catch {
    // Ignorar si localStorage no está disponible.
  }
}
