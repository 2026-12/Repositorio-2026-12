export function crearOrdenanzaInicial() {
  return {
    ordenanza: '',
    fundamentoLegal: '',
    plazoCumplimiento: '',
  };
}

export function crearOrdenSanitariaInicial() {
  return {
    informacionGeneral: {
      nombrePersonaNotificar: '',
      condicionPersonaNotificar: '',
      otraCondicion: '',
      identificacion: '',
      nombreEstablecimiento: '',
      numeroExpediente: '',
    },

    ubicacion: {
      provincia: '',
      canton: '',
      distrito: '',
      direccionExacta: '',
    },

    notificacion: {
      fechaEmision: '',
      fechaNotificacion: '',
    },

    motivo: '',

    ordenanzas: [
      crearOrdenanzaInicial(),
    ],

    responsable: {
      nombreCompleto: '',
      cargo: '',
      unidadOrganizativaArs: '',
      firma: '',
    },
  };
}