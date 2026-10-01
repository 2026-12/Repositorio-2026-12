import { describe, it, expect } from 'vitest';
import { validarHallazgos } from '../validacionHallazgos';
import { LONGITUD_MAXIMA_HALLAZGOS } from '../../config/actaGeneral';

// Cubre HU-009: para salir del Apartado IV (una vez empezado) se debe
// seleccionar al menos una guía aplicable y describir los hallazgos.
describe('validarHallazgos', () => {
  it('exige al menos una guía y la descripción cuando el apartado está vacío', () => {
    const errores = validarHallazgos({ idsGuias: [], hallazgos: '' });

    expect(errores.idsGuias).toBeDefined();
    expect(errores.hallazgos).toBeDefined();
  });

  it('no acepta una descripción con solo espacios', () => {
    const errores = validarHallazgos({ idsGuias: [1], hallazgos: '   ' });

    expect(errores).toEqual({ hallazgos: 'Describa los hallazgos de la inspección.' });
  });

  it('rechaza una descripción más larga que la columna HALLAZGOS', () => {
    const errores = validarHallazgos({ idsGuias: [1], hallazgos: 'a'.repeat(LONGITUD_MAXIMA_HALLAZGOS + 1) });

    expect(errores.hallazgos).toBeDefined();
  });

  it('no devuelve errores con una o varias guías y la descripción llena', () => {
    expect(validarHallazgos({ idsGuias: [1], hallazgos: 'Campana con grasa acumulada.' })).toEqual({});
    expect(validarHallazgos({ idsGuias: [1, 3], hallazgos: 'Campana con grasa acumulada.' })).toEqual({});
  });
});
