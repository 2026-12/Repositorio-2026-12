// Guarda el progreso en localStorage para que no se pierda si se recarga
// la página o se va el internet.
//
// Antes (hallazgo H4) usábamos una sola clave para guardar todo, entonces
// si tenías dos inspecciones abiertas (dos pestañas, o empezabas una nueva
// sin terminar la otra) una se comía el progreso de la otra. Ahora cada
// inspección guarda su progreso en su propia clave usando el idInspeccion,
// así no se pisan entre ellas.
const PREFIJO_CLAVE_PROGRESO = 'sggdis:inspeccion-en-curso';

// Clave aparte que guarda cuál fue la última inspección activa, para
// recuperarla sola al volver a abrir la app.
// Construye la clave específica de una inspección a partir de su idInspeccion.
function claveProgreso(idInspeccion) {
  return `${prefijoUsuario()}:${idInspeccion}`;
}

// Construye el prefijo de usuario a partir de la sesión actual.
function prefijoUsuario() {
  try {
    const sesion = JSON.parse(sessionStorage.getItem('sggdis:sesion'));
    return `${PREFIJO_CLAVE_PROGRESO}:${encodeURIComponent(sesion?.correo?.toLowerCase() ?? 'anonimo')}`;
  } catch {
    return `${PREFIJO_CLAVE_PROGRESO}:anonimo`;
  }
}

// Chequeo liviano para que el shell decida la pantalla inicial sin tener
// que cargar todo el progreso.
export function existeProgresoGuardado() {
  try {
    return Boolean(localStorage.getItem(`${prefijoUsuario()}:activa-id`));
  } catch {
    return false;
  }
}

// Recupera el progreso guardado al volver a abrir la app: busca la última
// inspección activa y carga su progreso específico.
export function cargarProgreso() {
  try {
    const idActivo = localStorage.getItem(`${prefijoUsuario()}:activa-id`);
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
    localStorage.setItem(`${prefijoUsuario()}:activa-id`, String(idInspeccion));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota llena, etc.): se ignora.
  }
}

// Borra el progreso guardado de una inspección (ya cerrada o cancelada).
// Si no se indica idInspeccion, borra la que estaba activa.
export function limpiarProgreso(idInspeccion) {
  try {
    const claveActiva = `${prefijoUsuario()}:activa-id`;
    const id = idInspeccion ?? localStorage.getItem(claveActiva);

    if (id) {
      localStorage.removeItem(claveProgreso(id));
    }

    localStorage.removeItem(claveActiva);
  } catch {
    // Ignorar si localStorage no está disponible.
  }
}
