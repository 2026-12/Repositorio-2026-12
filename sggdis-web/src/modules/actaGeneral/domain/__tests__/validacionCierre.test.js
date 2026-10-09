import { describe, it, expect } from 'vitest';
import { validarCierre, clavePersona } from '../validacionCierre';
import { MENSAJE_SOLO_NUMEROS } from '../validacionInfoGeneral';

// Cubre HU-011 (Apartado VI - Cierre y firmas): al menos una persona presente
// y todos los datos de cada persona.
const persona = (id, cambios = {}) => ({
  id,
  nombreCompleto: 'Juan Pérez Mora',
  cargoInstitucion: 'Inspector',
  numeroIdentificacion: '111111111',
  firma: 'J. Pérez',
  ...cambios,
});

describe('clavePersona', () => {
  it('arma la clave del error con el id de la persona y el campo', () => {
    expect(clavePersona(3, 'firma')).toBe('persona-3-firma');
  });
});

describe('validarCierre', () => {
  it('exige al menos una persona presente', () => {
    expect(validarCierre({ personasPresentes: [] })).toEqual({
      personasPresentes: 'Debe agregar al menos una persona presente.',
    });
    expect(validarCierre({}).personasPresentes).toBeDefined();
  });

  it('no devuelve errores con una o varias personas completas', () => {
    expect(validarCierre({ personasPresentes: [persona(1)] })).toEqual({});
    expect(validarCierre({ personasPresentes: [persona(1), persona(2, { nombreCompleto: 'Ana Rojas Vargas' })] })).toEqual({});
  });

  it('marca cada campo vacío de una persona con su propia clave y mensaje', () => {
    const errores = validarCierre({
      personasPresentes: [persona(7, { cargoInstitucion: '', firma: '   ' })],
    });

    expect(errores).toEqual({
      'persona-7-cargoInstitucion': 'El cargo o institución es obligatorio.',
      'persona-7-firma': 'La firma es obligatoria.',
    });
  });

  it('marca los cuatro campos de una persona recién agregada, en el orden del formulario', () => {
    const errores = validarCierre({
      personasPresentes: [{ id: 1, nombreCompleto: '', cargoInstitucion: '', numeroIdentificacion: '', firma: '' }],
    });

    expect(Object.keys(errores)).toEqual([
      'persona-1-nombreCompleto',
      'persona-1-cargoInstitucion',
      'persona-1-numeroIdentificacion',
      'persona-1-firma',
    ]);
  });

  it('la identificación de cada persona solo admite números', () => {
    const errores = validarCierre({
      personasPresentes: [persona(4, { numeroIdentificacion: '1-1111-1111' })],
    });

    expect(errores).toEqual({ 'persona-4-numeroIdentificacion': MENSAJE_SOLO_NUMEROS });
  });

  it('valida a cada persona por separado', () => {
    const errores = validarCierre({
      personasPresentes: [persona(1), persona(2, { numeroIdentificacion: '' })],
    });

    expect(Object.keys(errores)).toEqual(['persona-2-numeroIdentificacion']);
  });
});
