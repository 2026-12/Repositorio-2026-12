// Validación del Apartado I (Información General del Inmueble). Devuelve un
// objeto { campo: mensaje } solo con los campos que fallan, así el formulario
// puede mostrar el error debajo de cada input en vez de un solo mensaje genérico.

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarInfoGeneral(datos) {
  const errores = {};

  if (!datos.fechaInspeccion) {
    errores.fechaInspeccion = 'La fecha de inspección es obligatoria.';
  }

  if (!datos.horaInicio?.trim()) {
    errores.horaInicio = 'La hora de inicio es obligatoria.';
  }

  if (!datos.nombreComercial?.trim()) {
    errores.nombreComercial = 'El nombre comercial del establecimiento es obligatorio.';
  }

  if (!datos.provincia?.trim()) {
    errores.provincia = 'La provincia es obligatoria.';
  }

  if (!datos.canton?.trim()) {
    errores.canton = 'El cantón es obligatorio.';
  }

  if (!datos.distrito?.trim()) {
    errores.distrito = 'El distrito es obligatorio.';
  }

  if (!datos.direccionExacta?.trim()) {
    errores.direccionExacta = 'La dirección exacta es obligatoria.';
  }

  if (!datos.correoNotificaciones?.trim()) {
    errores.correoNotificaciones = 'El correo para notificaciones es obligatorio.';
  } else if (!PATRON_CORREO.test(datos.correoNotificaciones.trim())) {
    errores.correoNotificaciones = 'El correo no tiene un formato válido.';
  }

  // Las dos preguntas Sí/No del final del apartado también son obligatorias:
  // hay que responder cada una (Sí o No) para poder continuar.
  if (datos.autorizaIngreso !== true && datos.autorizaIngreso !== false) {
    errores.autorizaIngreso = 'Debe indicar si se autoriza el ingreso al establecimiento.';
  }

  if (datos.autorizaFotos !== true && datos.autorizaFotos !== false) {
    errores.autorizaFotos = 'Debe indicar si se autoriza tomar fotografías y/o videos.';
  }

  return errores;
}
