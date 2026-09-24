import { API_BASE_URL } from '../../inspecciones/config/inspeccion';

// Se reexporta la URL del backend para no duplicarla: el Acta General y las
// Guías de inspección corren en la misma API.
export { API_BASE_URL };

// Identificadores de cada apartado del wizard, en el orden en que se muestran
// los tabs. Cada HU futura (HU-007 a HU-011) va llenando el resto.
export const APARTADOS_ACTA = [
  { id: 'info-general', numero: 'I', etiqueta: 'Info General' },
  { id: 'responsable', numero: 'II', etiqueta: 'Responsable' },
  { id: 'motivo', numero: 'III', etiqueta: 'Motivo' },
  { id: 'hallazgos', numero: 'IV', etiqueta: 'Hallazgos' },
  { id: 'acciones', numero: 'V', etiqueta: 'Acciones' },
  { id: 'cierre', numero: 'VI', etiqueta: 'Cierre y Firmas' },
];
