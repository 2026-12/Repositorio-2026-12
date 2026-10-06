// Se reexporta la URL del backend para no duplicarla: el Acta General y las
// Guías de inspección corren en la misma API.
export { API_BASE_URL } from '../../../config/api';

// Identificadores de cada apartado del wizard, en el orden en que se muestran
// los tabs.
export const APARTADOS_ACTA = [
  { id: 'info-general', etiqueta: 'Info General' },
  { id: 'responsable', etiqueta: 'Responsable' },
  { id: 'motivo', etiqueta: 'Motivo' },
  { id: 'hallazgos', etiqueta: 'Hallazgos' },
  { id: 'acciones', etiqueta: 'Acciones' },
  { id: 'cierre', etiqueta: 'Cierre y Firmas' },
];

// Paso final del wizard, después del Apartado VI: resumen de solo lectura de
// toda el acta para revisarla (igual que la vista previa de Orden Sanitaria).
// No es un apartado con formulario, por eso no está en APARTADOS_ACTA (los
// tabs y el "Paso X de 6" solo cuentan los seis apartados).
export const APARTADO_VISTA_PREVIA = 'vista-previa';

// Máximo de caracteres de la descripción de hallazgos (Apartado IV). Es el
// mismo tamaño de la columna HALLAZGOS VARCHAR2(4000) de INS_ACTA_GENERAL.
export const LONGITUD_MAXIMA_HALLAZGOS = 4000;

// Opciones del literal "k. Cargo de la persona que atendió la inspección" del
// acta oficial (Apartado II). Selección múltiple; "OTRO" además habilita un
// campo de texto libre para especificarlo.
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
// (Apartado III). Selección múltiple; "OTRO" habilita el campo de texto libre.
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

// Opciones del Apartado V "Acciones a seguir" del acta oficial. Selección
// múltiple; "REPROGRAMACION" y "OTRO" habilitan cada una su campo de texto.
// Los valores deben coincidir con el CHECK CK_ACTA_GENERAL_ACCIONES de la BD.
export const ACCIONES_A_SEGUIR = [
  { valor: 'CIERRE_CASO', etiqueta: 'Cierre de caso' },
  { valor: 'ORDEN_SANITARIA', etiqueta: 'Orden Sanitaria' },
  { valor: 'RETENCION', etiqueta: 'Retención' },
  { valor: 'APOYO_TECNICO', etiqueta: 'Solicitud de apoyo técnico' },
  { valor: 'DECOMISO', etiqueta: 'Decomiso' },
  { valor: 'CLAUSURA', etiqueta: 'Clausura' },
  { valor: 'INFORME_TECNICO', etiqueta: 'Informe técnico' },
  { valor: 'INFORME_SANITARIO_TABACO', etiqueta: 'Informe sanitario (tabaco-vapeo)' },
  { valor: 'RETIRO_PSF', etiqueta: 'Retiro del Permiso Sanitario de Funcionamiento' },
  { valor: 'REPROGRAMACION', etiqueta: 'Reprogramación' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

// Máximo de caracteres de los textos del Apartado V (mismo tamaño que las
// columnas MOTIVO_REPROGRAMACION VARCHAR2(400) y ACCION_OTRO VARCHAR2(200)).
export const LONGITUD_MAXIMA_MOTIVO_REPROGRAMACION = 400;
export const LONGITUD_MAXIMA_ACCION_OTRO = 200;

// Máximo de caracteres de cada dato de una persona presente (Apartado VI).
// Deben coincidir con las longitudes que valida el backend al guardar.
export const LONGITUD_MAXIMA_NOMBRE_PERSONA = 200;
export const LONGITUD_MAXIMA_CARGO_INSTITUCION = 200;
export const LONGITUD_MAXIMA_IDENTIFICACION_PERSONA = 30;
export const LONGITUD_MAXIMA_FIRMA = 200;
