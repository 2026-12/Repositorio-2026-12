import { describe, expect, it } from 'vitest';

import {
  crearOrdenanzaVacia,
  crearOrdenSanitariaInicial,
  prepararOrdenSanitariaParaApi,
} from '../estructuraOrdenSanitaria';

// Cubre la estructura inicial de la Orden Sanitaria y la conversión de los
// datos del formulario al formato que espera la API (POST /api/ordenes-sanitarias).

/**
 * Crea una orden con los datos mínimos para convertirla al formato de la API.
 * @param {object} plazo Plazo de la única ordenanza.
 */
function crearOrdenParaApi(plazo) {
  const orden = crearOrdenSanitariaInicial({ idInspeccion: '1', nombreEstablecimiento: '  Soda La Esquina  ' });

  orden.informacionGeneral = {
    ...orden.informacionGeneral,
    nombreCompleto: '  Ana Lucía Vargas  ',
    condicion: 'Gerente',
    otraCondicion: 'Texto que no aplica',
    identificacion: '304560789',
    numeroExpediente: '',
    numeroConsecutivo: 'OS-PRUEBA-001',
  };
  orden.ubicacion = { idProvincia: 1, idCanton: 2, idDistrito: '3', direccionExacta: '  Del parque 100 m norte  ' };
  orden.ordenanzas = [{ ...crearOrdenanzaVacia(7), ordenanza: ' Limpiar ', fundamentoLegal: ' Art. 1 ', plazo }];
  orden.responsable = { nombreCompleto: 'María', cargo: 'Directora', unidadOrganizativaArs: 'ARS', firma: '   ' };

  return orden;
}

describe('estructuraOrdenSanitaria', () => {
  it('crea una ordenanza vacía con el número indicado y plazo en días por defecto', () => {
    const ordenanza = crearOrdenanzaVacia(3);

    expect(ordenanza.numeroOrden).toBe(3);
    expect(ordenanza.ordenanza).toBe('');
    expect(ordenanza.plazo.tipoPlazo).toBe('DIAS');
  });

  it('crea la orden inicial con una ordenanza y el establecimiento de la inspección', () => {
    const orden = crearOrdenSanitariaInicial({ idInspeccion: 5, nombreEstablecimiento: 'Soda La Esquina' });

    expect(orden.idInspeccion).toBe(5);
    expect(orden.informacionGeneral.nombreEstablecimiento).toBe('Soda La Esquina');
    expect(orden.ordenanzas).toHaveLength(1);
    expect(orden.notificacion.fechaNotificacion).toBe('');
  });

  it('convierte un plazo en días enviando solo la cantidad', () => {
    const orden = crearOrdenParaApi({ ...crearOrdenanzaVacia().plazo, tipoPlazo: 'DIAS', cantidad: '5' });

    const plazo = prepararOrdenSanitariaParaApi(orden).ordenanzas[0].plazo;

    expect(plazo).toEqual({
      tipoPlazo: 'DIAS',
      cantidad: 5,
      diaCumplimiento: null,
      mesCumplimiento: null,
      anioCumplimiento: null,
      horaCumplimiento: null,
    });
  });

  it('convierte un plazo por fecha enviando la fecha y la hora, sin cantidad', () => {
    const orden = crearOrdenParaApi({
      tipoPlazo: 'FECHA',
      cantidad: '9',
      diaCumplimiento: '15',
      mesCumplimiento: '11',
      anioCumplimiento: '2030',
      horaCumplimiento: '14:30',
    });

    const plazo = prepararOrdenSanitariaParaApi(orden).ordenanzas[0].plazo;

    expect(plazo).toEqual({
      tipoPlazo: 'FECHA',
      cantidad: null,
      diaCumplimiento: 15,
      mesCumplimiento: 11,
      anioCumplimiento: 2030,
      horaCumplimiento: '14:30',
    });
  });

  it('limpia espacios, convierte ids a número y omite los datos que no aplican', () => {
    const orden = crearOrdenParaApi({ ...crearOrdenanzaVacia().plazo, cantidad: '2' });

    const datosApi = prepararOrdenSanitariaParaApi(orden);

    expect(datosApi.idInspeccion).toBe(1);
    expect(datosApi.idDistrito).toBe(3);
    expect(datosApi.direccionExacta).toBe('Del parque 100 m norte');
    expect(datosApi.nombreEstablecimiento).toBe('Soda La Esquina');
    expect(datosApi.numeroExpediente).toBeNull();
    expect(datosApi.personaNotificada.nombreCompleto).toBe('Ana Lucía Vargas');
    expect(datosApi.personaNotificada.otraCondicion).toBeNull();
    expect(datosApi.ordenanzas[0].numeroOrden).toBe(1);
    expect(datosApi.ordenanzas[0].ordenanza).toBe('Limpiar');
    expect(datosApi.responsable.firma).toBeNull();
  });
});