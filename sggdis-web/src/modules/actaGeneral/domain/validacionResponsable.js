// Validación del Apartado II (Información del Responsable durante la
// inspección). Mismo formato que validarInfoGeneral: un objeto { campo:
// mensaje } solo con lo que falla.

import { esSoloNumeros, MENSAJE_SOLO_NUMEROS } from './validacionInfoGeneral';

export function validarResponsable(datos) {
  const errores = {};
  const cargoResponsable = datos.cargoResponsable ?? [];

  if (!datos.nombreResponsable?.trim()) {
    errores.nombreResponsable = 'El nombre de la persona responsable es obligatorio.';
  }

  if (cargoResponsable.length === 0) {
    errores.cargoResponsable = 'Debe indicar al menos un cargo de la persona que atendió la inspección.';
  } else if (cargoResponsable.includes('OTRO') && !datos.cargoResponsableOtro?.trim()) {
    // Si "Otro" está entre los cargos marcados, el literal del acta pide especificarlo por escrito.
    errores.cargoResponsableOtro = 'Especifique el cargo.';
  }

  if (!datos.numeroIdentificacionResponsable?.trim()) {
    errores.numeroIdentificacionResponsable = 'El número de identificación es obligatorio.';
  } else if (!esSoloNumeros(datos.numeroIdentificacionResponsable)) {
    errores.numeroIdentificacionResponsable = MENSAJE_SOLO_NUMEROS;
  }

  return errores;
}
