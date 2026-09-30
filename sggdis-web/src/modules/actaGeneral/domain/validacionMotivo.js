// Validación del Apartado III (Motivo de la inspección). Mismo formato que
// validarResponsable: un objeto { campo: mensaje } solo con lo que falla.

export function validarMotivo(datos) {
  const errores = {};

  if (!datos.motivoInspeccion) {
    errores.motivoInspeccion = 'Debe seleccionar el motivo de la inspección.';
  } else if (datos.motivoInspeccion === 'OTRO' && !datos.motivoInspeccionOtro?.trim()) {
    // Si el motivo es "Otro", el literal del acta pide especificarlo por escrito.
    errores.motivoInspeccionOtro = 'Especifique el motivo.';
  }

  return errores;
}
