// Validación del Apartado II (Información del Responsable durante la
// inspección). Mismo formato que validarInfoGeneral: un objeto { campo:
// mensaje } solo con lo que falla.

export function validarResponsable(datos) {
  const errores = {};

  if (!datos.nombreResponsable?.trim()) {
    errores.nombreResponsable = 'El nombre de la persona responsable es obligatorio.';
  }

  if (!datos.cargoResponsable) {
    errores.cargoResponsable = 'Debe indicar el cargo de la persona que atendió la inspección.';
  } else if (datos.cargoResponsable === 'OTRO' && !datos.cargoResponsableOtro?.trim()) {
    // Si el cargo es "Otro", el literal del acta pide especificarlo por escrito.
    errores.cargoResponsableOtro = 'Especifique el cargo.';
  }

  if (!datos.numeroIdentificacionResponsable?.trim()) {
    errores.numeroIdentificacionResponsable = 'El número de identificación es obligatorio.';
  }

  return errores;
}
