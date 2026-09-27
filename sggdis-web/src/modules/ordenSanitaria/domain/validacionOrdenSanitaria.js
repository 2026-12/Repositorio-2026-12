export function validarOrdenSanitaria(datos) {
  const errores = {};

  const obtenerFechaActual = () => {
    const fecha = new Date();
    const offset = fecha.getTimezoneOffset() * 60000;
    return new Date(fecha.getTime() - offset).toISOString().slice(0, 10);
  };

  const fechaActual = obtenerFechaActual();

  if (!datos.informacionGeneral.numeroConsecutivo?.trim()) {
    errores.numeroConsecutivo = 'No fue posible obtener el número consecutivo de la inspección relacionada.';
  }

  if (!datos.informacionGeneral.nombreCompleto?.trim()) {
    errores.nombreCompleto = 'No fue posible obtener el nombre de la persona a notificar desde la inspección relacionada.';
  }

  if (!datos.informacionGeneral.identificacion?.trim()) {
    errores.identificacion = 'No fue posible obtener el número de identificación desde la inspección relacionada.';
  }

  if (!datos.informacionGeneral.nombreEstablecimiento?.trim()) {
    errores.nombreEstablecimiento = 'No fue posible obtener el nombre del establecimiento desde la inspección relacionada.';
  }

  if (!datos.informacionGeneral.condicion?.trim()) {
    errores.condicion = 'Debe seleccionar la condición de la persona a notificar.';
  }

  if (
    datos.informacionGeneral.condicion === 'Otro' &&
    !datos.informacionGeneral.otraCondicion?.trim()
  ) {
    errores.otraCondicion = 'Debe indicar la otra condición.';
  }

  if (!datos.ubicacion.idProvincia) {
    errores.idProvincia = 'Debe seleccionar una provincia.';
  }

  if (!datos.ubicacion.idCanton) {
    errores.idCanton = 'Debe seleccionar un cantón.';
  }

  if (!datos.ubicacion.idDistrito) {
    errores.idDistrito = 'Debe seleccionar un distrito.';
  }

  if (!datos.ubicacion.direccionExacta?.trim()) {
    errores.direccionExacta = 'Debe indicar la dirección exacta.';
  }

  if (!datos.notificacion.fechaEmision) {
    errores.fechaEmision = 'Debe indicar la fecha de emisión.';
  } else if (datos.notificacion.fechaEmision < fechaActual) {
    errores.fechaEmision = 'La fecha de emisión no puede ser anterior a la fecha actual.';
  }

  if (!datos.notificacion.fechaNotificacion) {
    errores.fechaNotificacion = 'Debe indicar la fecha de notificación.';
  } else if (datos.notificacion.fechaNotificacion < fechaActual) {
    errores.fechaNotificacion = 'La fecha de notificación no puede ser anterior a la fecha actual.';
  }

  if (!datos.ordenanzas?.length) {
    errores.ordenanzas = 'Debe registrar al menos una ordenanza.';
  } else {
    datos.ordenanzas.forEach((ordenanza, index) => {
      if (!ordenanza.ordenanza?.trim()) {
        errores[`ordenanza-${index}`] = 'Debe indicar la ordenanza.';
      }

      if (!ordenanza.fundamentoLegal?.trim()) {
        errores[`fundamento-${index}`] = 'Debe indicar el fundamento legal.';
      }

      if (!ordenanza.plazo?.tipoPlazo) {
        errores[`plazo-${index}`] = 'Debe seleccionar el tipo de plazo.';
      } else if (ordenanza.plazo.tipoPlazo === 'FECHA') {
        if (
          !ordenanza.plazo.diaCumplimiento ||
          !ordenanza.plazo.mesCumplimiento ||
          !ordenanza.plazo.anioCumplimiento
        ) {
          errores[`plazo-${index}`] = 'Debe indicar la fecha de cumplimiento.';
        }
      } else if (!ordenanza.plazo.cantidad) {
        errores[`plazo-${index}`] = 'Debe indicar la cantidad del plazo.';
      }
    });
  }

  if (!datos.responsable.nombreCompleto?.trim()) {
    errores.responsableNombre = 'Debe indicar el nombre del responsable.';
  }

  if (!datos.responsable.cargo?.trim()) {
    errores.responsableCargo = 'Debe indicar el cargo del responsable.';
  }

  if (!datos.responsable.unidadOrganizativaArs?.trim()) {
    errores.responsableUnidad = 'Debe indicar la Unidad Organizativa o ARS.';
  }

  return errores;
}

export function tieneErrores(errores) {
  return Object.keys(errores).length > 0;
}