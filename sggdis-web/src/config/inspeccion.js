// Configuración general de la app: dónde vive el backend y qué guía se está usando.
export const API_BASE_URL = 'https://localhost:7119';
export const ID_GUIA_ACTIVA = 1;

// Códigos de sección que el frontend sabe cómo mostrar (deben existir componentes
// FormularioSeccionX para cada uno). Si el backend agrega una sección nueva que no
// esté aquí, simplemente no se va a mostrar en el formulario.
export const CODIGOS_RENDERIZABLES = new Set(['A', 'B1', 'B2', 'B3', 'C1', 'C2', 'D', 'E', 'F', 'G', 'H']);

// De la lista completa de secciones que manda el backend, deja solo las que se
// pueden mostrar y las ordena según el campo "orden".
export function obtenerSeccionesRenderizables(secciones = []) {
  return secciones
    .filter((seccion) => CODIGOS_RENDERIZABLES.has(seccion.codigo))
    .sort((a, b) => a.orden - b.orden);
}

// Nombres amigables que se muestran para cada paso del asistente (wizard).
export const nombresVistas = {
  A: 'Aspectos Generales',
  B: 'Cocina y Preparación',
  C: 'Bodega de Insumos',
  D: 'Medidas de Saneamiento',
  E: 'Manejo de Desechos',
  F: 'Área de Consumo',
  G: 'Servicio a Domicilio',
  H: 'Servicio de Catering',
}

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