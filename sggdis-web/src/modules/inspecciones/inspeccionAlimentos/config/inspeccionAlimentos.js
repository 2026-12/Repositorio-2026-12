// Identidad visual y textos legales de la guía de Alimentación. El núcleo
// genérico (FormularioSeccionGenerico) no conoce estos valores, los recibe como props.
export const MARCA_ALIMENTOS = {
  logo: 'MS',
  tituloGuia: 'Guía de Inspección — Servicios de Alimentación al Público',
};

// Nombres de las pestañas/pasos que ve el usuario mientras avanza por el formulario.
export const TABS_ALIMENTOS = [
  'Aspectos Generales', 'Cocina y Preparación', 'Bodega de Insumos', 'Servicios Sanitarios',
  'Manejo de Desechos', 'Control de Plagas', 'Salud del Personal', 'Cierre y Dictamen',
];

// Cantidad total de pasos del asistente (wizard), usado para la barra de progreso.
export const TOTAL_PASOS_ALIMENTOS = 9;

// Mensaje de advertencia que se muestra cuando se marca un ítem crítico como "No cumple".
export const TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS =
  'Al incumplir un punto crítico, se procederá inmediatamente a notificar mediante Orden Sanitaria según Art. 142 del Reglamento General de Alimentos.';

// Códigos de sección que el frontend sabe mostrar (necesitan su FormularioSeccionX).
// Si el backend agrega una sección nueva que no está acá, no se muestra.
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
