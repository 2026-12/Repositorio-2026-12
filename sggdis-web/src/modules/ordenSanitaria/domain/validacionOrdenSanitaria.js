function tieneValor(valor) {
  return typeof valor === 'string'
    ? valor.trim().length > 0
    : valor !== null && valor !== undefined;
}

export function validarInformacionGeneral(informacionGeneral) {
  const errores = {};

  if (!tieneValor(informacionGeneral.nombrePersonaNotificar)) {
    errores.nombrePersonaNotificar =
      'El nombre de la persona a notificar es obligatorio.';
  }

  if (!tieneValor(informacionGeneral.condicionPersonaNotificar)) {
    errores.condicionPersonaNotificar =
      'Debe seleccionar la condición de la persona a notificar.';
  }

  if (
    informacionGeneral.condicionPersonaNotificar === 'Otro'
    && !tieneValor(informacionGeneral.otraCondicion)
  ) {
    errores.otraCondicion =
      'Debe especificar la condición de la persona a notificar.';
  }

  if (!tieneValor(informacionGeneral.identificacion)) {
    errores.identificacion =
      'La identificación es obligatoria.';
  }

  if (!tieneValor(informacionGeneral.nombreEstablecimiento)) {
    errores.nombreEstablecimiento =
      'El nombre del establecimiento, sitio o inmueble es obligatorio.';
  }

  return errores;
}

export function validarUbicacion(ubicacion) {
  const errores = {};

  if (!tieneValor(ubicacion.provincia)) {
    errores.provincia =
      'Debe seleccionar una provincia.';
  }

  if (!tieneValor(ubicacion.canton)) {
    errores.canton =
      'Debe seleccionar un cantón.';
  }

  if (!tieneValor(ubicacion.distrito)) {
    errores.distrito =
      'Debe seleccionar un distrito.';
  }

  if (!tieneValor(ubicacion.direccionExacta)) {
    errores.direccionExacta =
      'La dirección exacta para notificar es obligatoria.';
  }

  return errores;
}

export function validarNotificacion(notificacion) {
  const errores = {};

  if (!tieneValor(notificacion.fechaEmision)) {
    errores.fechaEmision =
      'La fecha de emisión es obligatoria.';
  }

  if (!tieneValor(notificacion.fechaNotificacion)) {
    errores.fechaNotificacion =
      'La fecha de notificación es obligatoria.';
  }

  return errores;
}

export function validarMotivo(motivo) {
  const errores = {};

  if (!tieneValor(motivo)) {
    errores.motivo =
      'Debe indicar el motivo de la Orden Sanitaria.';
  }

  return errores;
}

export function validarOrdenanzas(ordenanzas) {
  const errores = {};

  if (!Array.isArray(ordenanzas) || ordenanzas.length === 0) {
    errores.ordenanzas =
      'Debe registrar al menos una ordenanza.';

    return errores;
  }

  const erroresPorOrdenanza = ordenanzas.map((ordenanza) => {
    const error = {};

    if (!tieneValor(ordenanza.ordenanza)) {
      error.ordenanza =
        'La ordenanza es obligatoria.';
    }

    if (!tieneValor(ordenanza.fundamentoLegal)) {
      error.fundamentoLegal =
        'El fundamento legal es obligatorio.';
    }

    if (!tieneValor(ordenanza.plazoCumplimiento)) {
      error.plazoCumplimiento =
        'El plazo de cumplimiento es obligatorio.';
    }

    return error;
  });

  const existenErrores = erroresPorOrdenanza.some(
    (error) => Object.keys(error).length > 0,
  );

  if (existenErrores) {
    errores.ordenanzas = erroresPorOrdenanza;
  }

  return errores;
}

export function validarResponsable(responsable) {
  const errores = {};

  if (!tieneValor(responsable.nombreCompleto)) {
    errores.nombreCompleto =
      'El nombre completo del director responsable es obligatorio.';
  }

  if (!tieneValor(responsable.cargo)) {
    errores.cargo =
      'El cargo del responsable es obligatorio.';
  }

  if (!tieneValor(responsable.unidadOrganizativaArs)) {
    errores.unidadOrganizativaArs =
      'El nombre de la Unidad Organizativa o ARS es obligatorio.';
  }

  if (!tieneValor(responsable.firma)) {
    errores.firma =
      'La firma es obligatoria.';
  }

  return errores;
}

export function tieneErrores(errores) {
  return Object.keys(errores).length > 0;
}