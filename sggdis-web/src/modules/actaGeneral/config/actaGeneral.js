// Se reexporta la URL del backend para no duplicarla: el Acta General y las
// Guías de inspección corren en la misma API.
export { API_BASE_URL } from '../../../config/api';

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

// Opciones del literal "k. Cargo de la persona que atendió la inspección" del
// acta oficial (Apartado II). El valor es el que viaja al backend; "OTRO"
// además habilita un campo de texto libre para especificarlo.
export const CARGOS_RESPONSABLE = [
  { valor: 'REPRESENTANTE_LEGAL', etiqueta: 'Representante legal' },
  { valor: 'DENUNCIANTE', etiqueta: 'Denunciante' },
  { valor: 'PRESIDENTE', etiqueta: 'Presidente(a)' },
  { valor: 'DENUNCIADO', etiqueta: 'Denunciado(a)' },
  { valor: 'ENCARGADO', etiqueta: 'Encargado(a)' },
  { valor: 'APODERADO', etiqueta: 'Apoderado(a)' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

// Opciones del literal 3 "Motivo de la inspección" del acta oficial
// (Apartado III). Selección única; "OTRO" habilita el campo de texto libre.
export const MOTIVOS_INSPECCION = [
  { valor: 'PRIMERA_VEZ_PSF', etiqueta: 'Primera vez Permiso Sanitario de Funcionamiento' },
  { valor: 'SEGUIMIENTO', etiqueta: 'Seguimiento' },
  { valor: 'RENOVACION_PSF', etiqueta: 'Renovación Permiso Sanitario de Funcionamiento' },
  { valor: 'DENUNCIA', etiqueta: 'Denuncia' },
  { valor: 'LEY_9028_10066', etiqueta: 'Ley N° 9028 y/o Ley N° 10066' },
  { valor: 'EVENTO_MASIVO', etiqueta: 'Evento masivo' },
  { valor: 'EMERGENCIA', etiqueta: 'Emergencia' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];
