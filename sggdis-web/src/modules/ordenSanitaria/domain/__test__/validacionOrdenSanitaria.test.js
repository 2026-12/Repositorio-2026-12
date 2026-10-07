import { describe, expect, it } from 'vitest';

import { tieneErrores, validarOrdenSanitaria } from '../validacionOrdenSanitaria';

// Cubre la validación del formulario de Orden Sanitaria (HU-023): campos
// obligatorios, coherencia de fechas, ordenanzas y plazos de cumplimiento.

/**
 * Devuelve una fecha en formato AAAA-MM-DD sumando días a la fecha local de hoy.
 * Usa el mismo cálculo de zona horaria que validacionOrdenSanitaria.js.
 * @param {number} dias Días a sumar (negativo para fechas pasadas).
 */
function obtenerFecha(dias = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const offset = fecha.getTimezoneOffset() * 60000;

  return new Date(fecha.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * Crea una Orden Sanitaria completa y válida, para modificar solo el dato
 * que se quiere probar en cada caso.
 */
function crearOrdenValida() {
  return {
    idInspeccion: 1,
    informacionGeneral: {
      nombreCompleto: 'Juan Carlos Rodríguez Mora',
      condicion: 'Propietario',
      otraCondicion: '',
      identificacion: '1-1234-5678',
      nombreEstablecimiento: 'Restaurante El Buen Sabor',
      numeroExpediente: 'MS-DRRSCS-ARS-SJ-AI-0002-2026',
      numeroConsecutivo: '',
    },
    ubicacion: {
      idProvincia: 1,
      idCanton: 1,
      idDistrito: 1,
      direccionExacta: 'Frente al parque central',
    },
    notificacion: {
      fechaEmision: obtenerFecha(0),
      fechaNotificacion: obtenerFecha(0),
    },
    ordenanzas: [
      {
        numeroOrden: 1,
        ordenanza: 'Instalar un lavamanos exclusivo en el área de preparación.',
        fundamentoLegal: 'Art. 18 del Reglamento',
        plazo: {
          tipoPlazo: 'DIAS',
          cantidad: '5',
          diaCumplimiento: '',
          mesCumplimiento: '',
          anioCumplimiento: '',
          horaCumplimiento: '',
        },
      },
    ],
    responsable: {
      nombreCompleto: 'María Fernández Solís',
      cargo: 'Directora',
      unidadOrganizativaArs: 'ARS San José Centro',
      firma: '',
    },
  };
}

describe('validarOrdenSanitaria', () => {
  it('no devuelve errores cuando la orden está completa (la firma es opcional)', () => {
    const errores = validarOrdenSanitaria(crearOrdenValida());

    expect(errores).toEqual({});
    expect(tieneErrores(errores)).toBe(false);
  });

  it('exige seleccionar la condición de la persona a notificar', () => {
    const orden = crearOrdenValida();
    orden.informacionGeneral.condicion = '';

    const errores = validarOrdenSanitaria(orden);

    expect(errores).toHaveProperty('condicion', 'Debe seleccionar la condición de la persona a notificar.');
    expect(tieneErrores(errores)).toBe(true);
  });

  it('exige indicar la otra condición cuando se selecciona "Otro"', () => {
    const orden = crearOrdenValida();
    orden.informacionGeneral.condicion = 'Otro';

    expect(validarOrdenSanitaria(orden)).toHaveProperty('otraCondicion', 'Debe indicar la otra condición.');
  });

  it('exige provincia, cantón, distrito y dirección exacta', () => {
    const orden = crearOrdenValida();
    orden.ubicacion = { idProvincia: '', idCanton: '', idDistrito: '', direccionExacta: '   ' };

    const errores = validarOrdenSanitaria(orden);

    expect(errores).toHaveProperty('idProvincia');
    expect(errores).toHaveProperty('idCanton');
    expect(errores).toHaveProperty('idDistrito');
    expect(errores).toHaveProperty('direccionExacta');
  });

  it('rechaza una fecha de emisión anterior a la fecha actual', () => {
    const orden = crearOrdenValida();
    orden.notificacion.fechaEmision = obtenerFecha(-1);

    expect(validarOrdenSanitaria(orden)).toHaveProperty(
      'fechaEmision',
      'La fecha de emisión no puede ser anterior a la fecha actual.'
    );
  });

  it('rechaza una fecha de notificación anterior a la fecha de emisión', () => {
    const orden = crearOrdenValida();
    orden.notificacion.fechaEmision = obtenerFecha(3);
    orden.notificacion.fechaNotificacion = obtenerFecha(1);

    expect(validarOrdenSanitaria(orden)).toHaveProperty(
      'fechaNotificacion',
      'La fecha de notificación no puede ser anterior a la fecha de emisión.'
    );
  });

  it('exige registrar al menos una ordenanza', () => {
    const orden = crearOrdenValida();
    orden.ordenanzas = [];

    expect(validarOrdenSanitaria(orden)).toHaveProperty('ordenanzas', 'Debe registrar al menos una ordenanza.');
  });

  it('exige el texto y el fundamento legal de cada ordenanza', () => {
    const orden = crearOrdenValida();
    orden.ordenanzas[0].ordenanza = '   ';
    orden.ordenanzas[0].fundamentoLegal = '';

    const errores = validarOrdenSanitaria(orden);

    expect(errores).toHaveProperty('ordenanza-0', 'Debe indicar la ordenanza.');
    expect(errores).toHaveProperty('fundamento-0', 'Debe indicar el fundamento legal.');
  });

  it('exige que la cantidad del plazo sea un número entero mayor que 0', () => {
    const orden = crearOrdenValida();
    orden.ordenanzas[0].plazo.cantidad = '0';

    expect(validarOrdenSanitaria(orden)).toHaveProperty(
      'plazo-0',
      'La cantidad del plazo debe ser un número entero mayor que 0.'
    );
  });

  it('rechaza una fecha de cumplimiento anterior a la fecha de notificación', () => {
    const orden = crearOrdenValida();
    const [anio, mes, dia] = obtenerFecha(5).split('-');

    orden.notificacion.fechaNotificacion = obtenerFecha(10);
    orden.ordenanzas[0].plazo = {
      tipoPlazo: 'FECHA',
      cantidad: '',
      diaCumplimiento: Number(dia),
      mesCumplimiento: Number(mes),
      anioCumplimiento: Number(anio),
      horaCumplimiento: '',
    };

    expect(validarOrdenSanitaria(orden)).toHaveProperty(
      'plazo-0',
      'La fecha de cumplimiento no puede ser anterior a la fecha de notificación.'
    );
  });

  it('exige el nombre, el cargo y la unidad del responsable', () => {
    const orden = crearOrdenValida();
    orden.responsable = { nombreCompleto: '', cargo: '', unidadOrganizativaArs: '', firma: '' };

    const errores = validarOrdenSanitaria(orden);

    expect(errores).toHaveProperty('responsableNombre');
    expect(errores).toHaveProperty('responsableCargo');
    expect(errores).toHaveProperty('responsableUnidad');
  });
});