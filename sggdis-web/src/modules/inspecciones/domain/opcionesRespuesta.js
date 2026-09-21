// Valores posibles del estado de una respuesta, centralizados para no repetir literales sueltos.
export const ESTADO_CUMPLE = 'Cumple';
export const ESTADO_NO_CUMPLE = 'No cumple';
export const ESTADO_NO_APLICA = 'N/A';

// Opciones estándar de respuesta para un ítem de inspección (Cumple/No cumple/N/A).
export const OPCIONES_ESTANDAR = [
  { valor: ESTADO_CUMPLE, icono: '✓' },
  { valor: ESTADO_NO_CUMPLE, icono: '✗' },
  { valor: ESTADO_NO_APLICA, icono: '—' },
];

// Clase CSS asociada a cada valor de opción, para el estilo del botón.
const CLASES_POR_ESTADO = {
  [ESTADO_CUMPLE]: 'cumple',
  [ESTADO_NO_CUMPLE]: 'no-cumple',
  [ESTADO_NO_APLICA]: 'na',
};

export function obtenerClaseOpcion(valor) {
  return CLASES_POR_ESTADO[valor] ?? 'na';
}
