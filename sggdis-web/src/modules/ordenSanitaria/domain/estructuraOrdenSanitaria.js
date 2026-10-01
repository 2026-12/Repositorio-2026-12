export function crearOrdenanzaVacia(numeroOrden = 1) {
  return {
    numeroOrden,
    ordenanza: '',
    fundamentoLegal: '',

    plazo: {
      tipoPlazo: 'DIAS',
      cantidad: '',
      diaCumplimiento: '',
      mesCumplimiento: '',
      anioCumplimiento: '',
      horaCumplimiento: '',
    },
  };
}

function obtenerFechaActual() {
  const fecha = new Date();
  const offset =
    fecha.getTimezoneOffset() * 60000;

  return new Date(fecha.getTime() - offset)
    .toISOString()
    .slice(0, 10);
}

export function crearOrdenSanitariaInicial({
  idInspeccion = '',
  nombreEstablecimiento = '',
} = {}) {
  const fechaActual = obtenerFechaActual();

  return {
    idInspeccion,

    informacionGeneral: {
      nombreCompleto: '',
      condicion: '',
      otraCondicion: '',
      identificacion: '',
      nombreEstablecimiento,
      numeroExpediente: '',
      numeroConsecutivo: '',
    },

    ubicacion: {
      idProvincia: '',
      idCanton: '',
      idDistrito: '',
      direccionExacta: '',
    },

    notificacion: {
      fechaEmision: fechaActual,
      fechaNotificacion: fechaActual,
    },

    ordenanzas: [
      crearOrdenanzaVacia(1),
    ],

    responsable: {
      nombreCompleto: '',
      cargo: '',
      unidadOrganizativaArs: '',
      firma: '',
    },
  };
}

export function prepararOrdenSanitariaParaApi(datos) {
  return {
    idInspeccion:
      Number(datos.idInspeccion),

    idDistrito:
      Number(datos.ubicacion.idDistrito),

    direccionExacta:
      datos.ubicacion.direccionExacta.trim(),

    numeroConsecutivo:
      datos.informacionGeneral
        .numeroConsecutivo
        .trim(),

    numeroExpediente:
      datos.informacionGeneral
        .numeroExpediente
        ?.trim() || null,

    nombreEstablecimiento:
      datos.informacionGeneral
        .nombreEstablecimiento
        .trim(),

    fechaEmision:
      datos.notificacion.fechaEmision,

    fechaNotificacion:
      datos.notificacion.fechaNotificacion,

    personaNotificada: {
      nombreCompleto:
        datos.informacionGeneral
          .nombreCompleto
          .trim(),

      condicion:
        datos.informacionGeneral
          .condicion
          .trim(),

      otraCondicion:
        datos.informacionGeneral.condicion === 'Otro'
          ? datos.informacionGeneral
              .otraCondicion
              ?.trim() || null
          : null,

      identificacion:
        datos.informacionGeneral
          .identificacion
          .trim(),
    },

    ordenanzas:
      datos.ordenanzas.map(
        (ordenanza, index) => ({
          numeroOrden:
            index + 1,

          ordenanza:
            ordenanza.ordenanza.trim(),

          fundamentoLegal:
            ordenanza.fundamentoLegal.trim(),

          plazo: {
            tipoPlazo:
              ordenanza.plazo.tipoPlazo,

            cantidad:
              ordenanza.plazo.tipoPlazo === 'FECHA'
                ? null
                : Number(
                    ordenanza.plazo.cantidad
                  ) || null,

            diaCumplimiento:
              ordenanza.plazo.tipoPlazo === 'FECHA'
                ? Number(
                    ordenanza.plazo.diaCumplimiento
                  ) || null
                : null,

            mesCumplimiento:
              ordenanza.plazo.tipoPlazo === 'FECHA'
                ? Number(
                    ordenanza.plazo.mesCumplimiento
                  ) || null
                : null,

            anioCumplimiento:
              ordenanza.plazo.tipoPlazo === 'FECHA'
                ? Number(
                    ordenanza.plazo.anioCumplimiento
                  ) || null
                : null,

            horaCumplimiento:
              ordenanza.plazo.tipoPlazo === 'FECHA'
                ? ordenanza.plazo
                    .horaCumplimiento || null
                : null,
          },
        })
      ),

    responsable: {
      nombreCompleto:
        datos.responsable
          .nombreCompleto
          .trim(),

      cargo:
        datos.responsable
          .cargo
          .trim(),

      unidadOrganizativaArs:
        datos.responsable
          .unidadOrganizativaArs
          .trim(),

      firma:
        datos.responsable
          .firma
          ?.trim() || null,
    },
  };
}