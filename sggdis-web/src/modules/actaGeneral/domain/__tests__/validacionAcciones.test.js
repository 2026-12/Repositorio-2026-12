import { describe, it, expect } from 'vitest';
import { validarAcciones } from '../validacionAcciones';

// Cubre HU-010 (Apartado V - Acciones a seguir): selección múltiple, y los
// textos de "Reprogramación" y "Otro" solo son obligatorios si se eligen.
describe('validarAcciones', () => {
  it('exige elegir al menos una acción', () => {
    expect(validarAcciones({ acciones: [] }).acciones).toBe('Debe seleccionar al menos una acción a seguir.');
    expect(validarAcciones({}).acciones).toBeDefined();
  });

  it('acepta varias acciones que no necesitan texto adicional', () => {
    expect(validarAcciones({ acciones: ['CIERRE_CASO', 'ORDEN_SANITARIA'] })).toEqual({});
  });

  it('exige el motivo cuando se elige Reprogramación', () => {
    const errores = validarAcciones({ acciones: ['REPROGRAMACION'], motivoReprogramacion: '  ' });

    expect(errores).toEqual({ motivoReprogramacion: 'Indique el motivo de la reprogramación.' });
  });

  it('exige especificar la acción cuando se elige Otro', () => {
    const errores = validarAcciones({ acciones: ['OTRO'], accionOtro: '' });

    expect(errores).toEqual({ accionOtro: 'Especifique la acción.' });
  });

  it('pide ambos textos si se eligen Reprogramación y Otro sin completarlos', () => {
    const errores = validarAcciones({ acciones: ['CIERRE_CASO', 'REPROGRAMACION', 'OTRO'] });

    expect(Object.keys(errores)).toEqual(['motivoReprogramacion', 'accionOtro']);
  });

  it('no devuelve errores con las tres acciones y sus textos completos', () => {
    expect(
      validarAcciones({
        acciones: ['CIERRE_CASO', 'REPROGRAMACION', 'OTRO'],
        motivoReprogramacion: 'Falta documentación pendiente del establecimiento.',
        accionOtro: 'Seguimiento en 15 días',
      })
    ).toEqual({});
  });
});
