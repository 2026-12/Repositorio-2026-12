import { describe, it, expect } from 'vitest';
import {
  validarInfoGeneral,
  esSoloNumeros,
  limpiarSoloNumeros,
  MENSAJE_SOLO_NUMEROS,
} from '../validacionInfoGeneral';

// Cubre HU-006 (Apartado I - Información General del Inmueble): campos
// obligatorios, formato del correo y las dos preguntas Sí/No.
function datosCompletos(cambios = {}) {
  return {
    fechaInspeccion: '2026-10-07',
    horaInicio: '14:30',
    numeroExpediente: '',
    numeroDenuncia: '',
    nombreComercial: 'Soda Cypress Acta',
    provincia: 'San José',
    canton: 'San José',
    distrito: 'Carmen',
    direccionExacta: '100 metros norte de la iglesia',
    telefonoContacto: '',
    correoNotificaciones: 'cypress@correo.com',
    autorizaIngreso: true,
    autorizaFotos: true,
    ...cambios,
  };
}

describe('validarInfoGeneral', () => {
  it('no devuelve errores con los campos obligatorios llenos (expediente, denuncia y teléfono son opcionales)', () => {
    expect(validarInfoGeneral(datosCompletos())).toEqual({});
  });

  it('marca todos los obligatorios cuando el apartado está vacío, en el orden del formulario', () => {
    const errores = validarInfoGeneral({});

    expect(Object.keys(errores)).toEqual([
      'fechaInspeccion',
      'horaInicio',
      'nombreComercial',
      'provincia',
      'canton',
      'distrito',
      'direccionExacta',
      'correoNotificaciones',
      'autorizaIngreso',
      'autorizaFotos',
    ]);
  });

  it('no acepta campos de texto con solo espacios', () => {
    const errores = validarInfoGeneral(datosCompletos({ nombreComercial: '   ', direccionExacta: '  ' }));

    expect(errores.nombreComercial).toBe('El nombre comercial del establecimiento es obligatorio.');
    expect(errores.direccionExacta).toBe('La dirección exacta es obligatoria.');
  });

  it('rechaza un correo con formato inválido', () => {
    ['correo-invalido', 'a@b', 'a b@c.com', '@correo.com'].forEach((correo) => {
      const errores = validarInfoGeneral(datosCompletos({ correoNotificaciones: correo }));
      expect(errores.correoNotificaciones).toBe('El correo no tiene un formato válido.');
    });
  });

  it('acepta un correo válido aunque tenga espacios alrededor', () => {
    expect(validarInfoGeneral(datosCompletos({ correoNotificaciones: '  cypress@correo.com  ' }))).toEqual({});
  });

  it('exige responder Sí o No en ambas autorizaciones: null/undefined fallan', () => {
    const errores = validarInfoGeneral(datosCompletos({ autorizaIngreso: null, autorizaFotos: undefined }));

    expect(errores.autorizaIngreso).toBe('Debe indicar si se autoriza el ingreso al establecimiento.');
    expect(errores.autorizaFotos).toBe('Debe indicar si se autoriza tomar fotografías y/o videos.');
  });

  it('acepta "No" (false) como respuesta válida en las autorizaciones', () => {
    expect(validarInfoGeneral(datosCompletos({ autorizaIngreso: false, autorizaFotos: false }))).toEqual({});
  });

  it('el teléfono es opcional, pero si se escribe solo admite números', () => {
    expect(validarInfoGeneral(datosCompletos({ telefonoContacto: '25500000' }))).toEqual({});
    expect(validarInfoGeneral(datosCompletos({ telefonoContacto: '2550-0000' }))).toEqual({
      telefonoContacto: MENSAJE_SOLO_NUMEROS,
    });
  });
});

describe('utilidades de solo números (teléfono e identificaciones)', () => {
  it('limpiarSoloNumeros deja únicamente los dígitos', () => {
    expect(limpiarSoloNumeros('1-2345-6789')).toBe('123456789');
    expect(limpiarSoloNumeros('(506) 2550 0000')).toBe('5062550' + '0000');
    expect(limpiarSoloNumeros()).toBe('');
  });

  it('esSoloNumeros acepta dígitos y rechaza guiones, letras, espacios internos y vacío', () => {
    expect(esSoloNumeros('123456789')).toBe(true);
    expect(esSoloNumeros(' 123 ')).toBe(true);
    expect(esSoloNumeros('1-2345')).toBe(false);
    expect(esSoloNumeros('12a')).toBe(false);
    expect(esSoloNumeros('1 2')).toBe(false);
    expect(esSoloNumeros('')).toBe(false);
  });
});
