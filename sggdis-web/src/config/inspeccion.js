export const API_BASE_URL = 'https://localhost:7119';
export const ID_GUIA_ACTIVA = 1;
export const CODIGOS_RENDERIZABLES = new Set(['A', 'B1', 'B2', 'B3', 'C1', 'C2', 'D', 'E', 'F', 'G', 'H']);

export function obtenerSeccionesRenderizables(secciones = []) {
  return secciones
    .filter((seccion) => CODIGOS_RENDERIZABLES.has(seccion.codigo))
    .sort((a, b) => a.orden - b.orden);
}
export const nombresVistas = {
  A: 'Aspectos Generales',
  B: 'Cocina y Preparación',
  C: 'Bodega de Insumos',
  D: 'Medidas de Saneamiento',
  E: 'Manejo de Desechos',
  F: 'Área de Consumo',
  G: 'Servicio a Domicilio',
}

// Rangos de clasificación según el porcentaje de cumplimiento (Art. 65 del Reglamento).
export const RANGOS_CLASIFICACION = [
  { hasta: 69, etiqueta: 'Condiciones inaceptables', clase: 'inaceptable', icono: '✕' },
  { hasta: 80, etiqueta: 'Condiciones deficientes', clase: 'deficiente', icono: '⚠' },
  { hasta: 100, etiqueta: 'Buenas condiciones', clase: 'buena', icono: '✓' },
];

export const TEXTO_ORDEN_SANITARIA =
  'Disponible siempre que se identifique una situación que atente contra la salud pública ' +
  '(Art. 65 del Reglamento), sin importar el puntaje total obtenido en la inspección.';