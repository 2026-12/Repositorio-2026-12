// Validación del Apartado III (Motivo de la inspección). Mismo formato que
// validarResponsable: un objeto { campo: mensaje } solo con lo que falla.

export function validarMotivo(datos) {
  const errores = {};
  const motivoInspeccion = datos.motivoInspeccion ?? [];

  if (motivoInspeccion.length === 0) {
    errores.motivoInspeccion = 'Debe seleccionar al menos un motivo de la inspección.';
  } else if (motivoInspeccion.includes('OTRO') && !datos.motivoInspeccionOtro?.trim()) {
    // Si "Otro" está entre los motivos marcados, el literal del acta pide especificarlo por escrito.
    errores.motivoInspeccionOtro = 'Especifique el motivo.';
  }

  return errores;
}
