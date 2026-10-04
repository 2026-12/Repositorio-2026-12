import { LONGITUD_MAXIMA_HALLAZGOS } from '../config/actaGeneral';

// Validación del Apartado IV (Hallazgos de la inspección). Mismo formato que
// validarMotivo: un objeto { campo: mensaje } solo con lo que falla.

export function validarHallazgos(datos) {
  const errores = {};

  if (!datos.idsGuias?.length) {
    errores.idsGuias = 'Debe seleccionar al menos una guía aplicable.';
  }

  const hallazgos = datos.hallazgos?.trim() ?? '';

  if (!hallazgos) {
    errores.hallazgos = 'Describa los hallazgos de la inspección.';
  } else if (hallazgos.length > LONGITUD_MAXIMA_HALLAZGOS) {
    errores.hallazgos = `La descripción no puede superar los ${LONGITUD_MAXIMA_HALLAZGOS} caracteres.`;
  }

  return errores;
}
