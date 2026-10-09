import { describe, it, expect } from 'vitest';
import { validarMotivo } from '../validacionMotivo';

// Cubre HU-008 (Apartado III - Motivo de la inspección).
describe('validarMotivo', () => {
  it('exige elegir un motivo cuando no hay ninguno', () => {
    expect(validarMotivo({ motivoInspeccion: [] }).motivoInspeccion).toBe(
      'Debe seleccionar al menos un motivo de la inspección.'
    );
    expect(validarMotivo({}).motivoInspeccion).toBeDefined();
  });

  it('no devuelve errores con un motivo elegido', () => {
    expect(validarMotivo({ motivoInspeccion: ['SEGUIMIENTO'], motivoInspeccionOtro: '' })).toEqual({});
  });

  it('exige especificar el motivo cuando se elige "Otro"', () => {
    const errores = validarMotivo({ motivoInspeccion: ['OTRO'], motivoInspeccionOtro: '   ' });

    expect(errores).toEqual({ motivoInspeccionOtro: 'Especifique el motivo.' });
  });

  it('acepta "Otro" cuando se especifica el motivo', () => {
    expect(validarMotivo({ motivoInspeccion: ['OTRO'], motivoInspeccionOtro: 'Verificación de condiciones sanitarias' })).toEqual({});
  });
});
