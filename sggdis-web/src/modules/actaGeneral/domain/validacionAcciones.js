// Validación del Apartado V (Acciones a seguir). Mismo formato que
// validarMotivo: un objeto { campo: mensaje } solo con lo que falla.

export function validarAcciones(datos) {
  const errores = {};
  const acciones = datos.acciones ?? [];

  if (acciones.length === 0) {
    errores.acciones = 'Debe seleccionar al menos una acción a seguir.';
  }

  // Cada texto solo es obligatorio mientras su acción esté seleccionada.
  if (acciones.includes('REPROGRAMACION') && !datos.motivoReprogramacion?.trim()) {
    errores.motivoReprogramacion = 'Indique el motivo de la reprogramación.';
  }

  if (acciones.includes('OTRO') && !datos.accionOtro?.trim()) {
    errores.accionOtro = 'Especifique la acción.';
  }

  return errores;
}
