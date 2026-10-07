// Pestañas de navegación entre los cinco pasos de la Orden Sanitaria.
//
// Sigue el mismo patrón visual de "píldora" que las pestañas de la Guía de
// Inspección (formulario.css → .tabs__item) y del Acta General
// (ActaGeneralModulo.css → .acta-tab):
//   - Paso pendiente: sin borde.
//   - Paso completo: borde verde (contorno), fondo transparente.
//   - Paso completo y activo: relleno verde.
//   - Paso activo sin completar: relleno azul oscuro institucional.
//   - Paso con error: borde rojo; si además está activo, relleno rojo.
//
// De esta forma el paso activo siempre se distingue de los demás, aunque esté
// completo o tenga errores. Además, el estado se comunica también en texto
// para lectores de pantalla (estándar D07: ningún estado solo por color).

const PASOS = [
  'Información General',
  'Ubicación',
  'Notificación',
  'Ordenanzas',
  'Responsable',
];

/**
 * Construye la lista de clases CSS de una pestaña según su estado.
 * @param {{ activo: boolean, completo: boolean, conError: boolean }} estado
 * @returns {string} Clases separadas por espacio.
 */
function obtenerClasesPestana({ activo, completo, conError }) {
  return [
    'orden-tab',
    completo && !conError ? 'orden-tab--completo' : '',
    conError ? 'orden-tab--error' : '',
    activo ? 'orden-tab--activo' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Devuelve el texto alternativo (solo para lectores de pantalla) que describe
 * el estado de la pestaña.
 * @param {{ completo: boolean, conError: boolean }} estado
 * @returns {string} Texto del estado o cadena vacía si está pendiente.
 */
function obtenerTextoEstado({ completo, conError }) {
  if (conError) return ' (con campos pendientes)';
  if (completo) return ' (completo)';
  return '';
}

/**
 * Barra de pestañas de la Orden Sanitaria.
 * @param {object} props
 * @param {number} props.pasoActual Índice del paso visible.
 * @param {number[]} props.pasosCompletos Índices de los pasos sin errores.
 * @param {number[]} props.pasosConError Índices de los pasos con errores de validación.
 * @param {(paso: number) => void} props.onCambiarPaso Se ejecuta al seleccionar una pestaña.
 */
export default function NavegacionOrdenSanitaria({
  pasoActual,
  pasosCompletos = [],
  pasosConError = [],
  onCambiarPaso,
}) {
  return (
    <nav className="orden-tabs" aria-label="Pasos de la Orden Sanitaria">
      {PASOS.map((nombre, index) => {
        const activo = pasoActual === index;
        const completo = pasosCompletos.includes(index);
        const conError = pasosConError.includes(index);
        const textoEstado = obtenerTextoEstado({ completo, conError });

        return (
          <button
            key={nombre}
            type="button"
            className={obtenerClasesPestana({ activo, completo, conError })}
            aria-current={activo ? 'step' : undefined}
            onClick={() => onCambiarPaso(index)}
          >
            <span className="orden-tab__texto">{nombre}</span>

            {textoEstado && (
              <span className="orden-tab__srSolo">{textoEstado}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}