import { describe, it, expect } from 'vitest';
import { validarResponsable } from '../validacionResponsable';
import { MENSAJE_SOLO_NUMEROS } from '../validacionInfoGeneral';

// Cubre HU-007 (Apartado II - Responsable durante la inspección).
describe('validarResponsable', () => {
  const completo = {
    nombreResponsable: 'María Fernández Solano',
    cargoResponsable: ['ENCARGADO'],
    cargoResponsableOtro: '',
    numeroIdentificacionResponsable: '123456789',
  };

  it('no devuelve errores con nombre, cargo e identificación', () => {
    expect(validarResponsable(completo)).toEqual({});
  });

  it('marca nombre, cargo e identificación cuando el apartado está vacío', () => {
    const errores = validarResponsable({ nombreResponsable: '', cargoResponsable: [], numeroIdentificacionResponsable: '' });

    expect(Object.keys(errores)).toEqual(['nombreResponsable', 'cargoResponsable', 'numeroIdentificacionResponsable']);
  });

  it('no acepta nombre ni identificación con solo espacios', () => {
    const errores = validarResponsable({ ...completo, nombreResponsable: '  ', numeroIdentificacionResponsable: ' ' });

    expect(errores.nombreResponsable).toBeDefined();
    expect(errores.numeroIdentificacionResponsable).toBeDefined();
  });

  it('la identificación solo admite números: rechaza guiones y otros símbolos', () => {
    ['1-2345-6789', '1 2345 6789', 'ABC123'].forEach((identificacion) => {
      const errores = validarResponsable({ ...completo, numeroIdentificacionResponsable: identificacion });

      expect(errores).toEqual({ numeroIdentificacionResponsable: MENSAJE_SOLO_NUMEROS });
    });
  });

  it('trata un cargo ausente (undefined) como sin cargo', () => {
    const errores = validarResponsable({ ...completo, cargoResponsable: undefined });

    expect(errores.cargoResponsable).toContain('al menos un cargo');
  });

  it('exige especificar el cargo cuando se elige "Otro"', () => {
    const errores = validarResponsable({ ...completo, cargoResponsable: ['OTRO'], cargoResponsableOtro: '  ' });

    expect(errores).toEqual({ cargoResponsableOtro: 'Especifique el cargo.' });
  });

  it('acepta "Otro" cuando se especifica el cargo', () => {
    expect(validarResponsable({ ...completo, cargoResponsable: ['OTRO'], cargoResponsableOtro: 'Administradora del local' })).toEqual({});
  });

  it('no pide especificar si "Otro" no está elegido', () => {
    expect(validarResponsable({ ...completo, cargoResponsable: ['PRESIDENTE'], cargoResponsableOtro: '' })).toEqual({});
  });
});
