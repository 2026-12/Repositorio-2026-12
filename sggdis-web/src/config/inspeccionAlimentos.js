// Identidad visual y textos legales propios de la guía de inspección de
// Servicios de Alimentación al Público. El núcleo genérico de formularios
// (FormularioSeccionGenerico) no conoce estos valores: los recibe como props.
// Logo y título que se muestran en el encabezado del formulario.
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
  '🛡 Al incumplir un punto crítico, se procederá inmediatamente a notificar mediante Orden Sanitaria según Art. 142 del Reglamento General de Alimentos.';
