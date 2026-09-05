export const API_BASE_URL = 'https://localhost:7119';
export const ID_GUIA_ACTIVA = 1;
export const CODIGOS_RENDERIZABLES = new Set(['A', 'B1', 'B2', 'B3', 'C1', 'C2', 'D', 'E', 'F', 'G']);

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

