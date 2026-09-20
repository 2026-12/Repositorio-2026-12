// Configuración general de la app: dónde vive el backend y qué guía se está usando.
export const API_BASE_URL = 'https://localhost:7119';
export const ID_GUIA_ACTIVA = 1;

// Rangos de clasificación según el porcentaje de cumplimiento (Art. 65 del Reglamento).
// Se recorren en orden y se usa el primero cuyo porcentaje sea menor o igual a "hasta".
export const RANGOS_CLASIFICACION = [
  { hasta: 69, etiqueta: 'Condiciones inaceptables', clase: 'inaceptable', icono: '✕' },
  { hasta: 80, etiqueta: 'Condiciones deficientes', clase: 'deficiente', icono: '⚠' },
  { hasta: 100, etiqueta: 'Buenas condiciones', clase: 'buena', icono: '✓' },
];

// Texto explicativo que se muestra junto a la casilla de "orden sanitaria" en el cierre.
export const TEXTO_ORDEN_SANITARIA =
  'Disponible siempre que se identifique una situación que atente contra la salud pública ' +
  '(Art. 65 del Reglamento), sin importar el puntaje total obtenido en la inspección.';