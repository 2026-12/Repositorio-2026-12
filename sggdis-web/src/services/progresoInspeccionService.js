// Persiste el progreso de la inspección en curso para que no se pierda si se
// recarga la página o se pierde la conexión (requisito de uso sin conexión).
const CLAVE_PROGRESO = 'sggdis:inspeccion-en-curso';

// Recupera el progreso guardado (si existe) al volver a abrir la app.
export function cargarProgreso() {
  try {
    const guardado = localStorage.getItem(CLAVE_PROGRESO);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

// Guarda el progreso actual del formulario en el navegador.
export function guardarProgreso(progreso) {
  try {
    localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(progreso));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota llena, etc.): se ignora.
  }
}

// Borra el progreso guardado (ej. cuando la inspección ya se cerró o se canceló).
export function limpiarProgreso() {
  try {
    localStorage.removeItem(CLAVE_PROGRESO);
  } catch {
    // Ignorar si localStorage no está disponible.
  }
}
