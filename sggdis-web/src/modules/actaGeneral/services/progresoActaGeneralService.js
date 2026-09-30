// Recuerda, en este navegador, cuál es el Acta General en curso y en qué
// apartado quedó el inspector. El contenido real del acta (todos los campos)
// vive en el backend gracias al autoguardado por apartado; acá solo se
// guarda el id y el apartado activo, lo mínimo para poder retomarla si se
// recarga la página en medio del llenado en vez de crear una acta nueva y
// perder lo que ya se había guardado.
const CLAVE_ACTA_ACTIVA = 'sggdis:acta-general-activa';

// Recupera { idActa, apartadoActivo } del acta que estaba en curso, o null
// si no hay ninguna (primera vez que se abre el módulo, o el almacenamiento
// no está disponible).
export function obtenerActaActiva() {
  try {
    const crudo = localStorage.getItem(CLAVE_ACTA_ACTIVA);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

// Guarda cuál es el acta activa y en qué apartado está el inspector.
export function guardarActaActiva({ idActa, apartadoActivo }) {
  try {
    if (!idActa) return;
    localStorage.setItem(CLAVE_ACTA_ACTIVA, JSON.stringify({ idActa, apartadoActivo }));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota llena, etc.): se ignora.
  }
}

// Olvida el acta activa (por ejemplo, cuando en el futuro se implemente el
// cierre del acta en HU-011).
export function limpiarActaActiva() {
  try {
    localStorage.removeItem(CLAVE_ACTA_ACTIVA);
  } catch {
    // Ignorar si localStorage no está disponible.
  }
}
