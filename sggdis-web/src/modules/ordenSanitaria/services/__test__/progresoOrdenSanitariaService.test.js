import { beforeEach, describe, expect, it } from 'vitest';

import {
  cargarProgresoOrdenSanitaria,
  existeProgresoOrdenSanitaria,
  guardarProgresoOrdenSanitaria,
  limpiarProgresoOrdenSanitaria,
} from '../progresoOrdenSanitariaService';

/**
 * Crea un progreso mínimo de prueba para una inspección.
 * @param {number} idInspeccion
 * @param {string} nombreEstablecimiento
 */
function crearProgreso(idInspeccion, nombreEstablecimiento) {
  return {
    datos: {
      idInspeccion,
      informacionGeneral: { nombreEstablecimiento },
    },
    pasoActual: 2,
  };
}

describe('progresoOrdenSanitariaService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('carga el progreso de la inspección pedida aunque otra orden sea la activa', () => {
    guardarProgresoOrdenSanitaria(crearProgreso(10, 'Soda A'));
    guardarProgresoOrdenSanitaria(crearProgreso(20, 'Soda B'));

    const progreso = cargarProgresoOrdenSanitaria(10);

    expect(progreso.datos.idInspeccion).toBe(10);
    expect(progreso.datos.informacionGeneral.nombreEstablecimiento).toBe('Soda A');
  });

  it('devuelve null si la inspección pedida no tiene progreso, sin usar la orden activa', () => {
    guardarProgresoOrdenSanitaria(crearProgreso(10, 'Soda A'));

    expect(cargarProgresoOrdenSanitaria(20)).toBeNull();
  });

  it('retoma la orden activa cuando no se indica idInspeccion (recarga de página)', () => {
    guardarProgresoOrdenSanitaria(crearProgreso(10, 'Soda A'));

    expect(cargarProgresoOrdenSanitaria().datos.idInspeccion).toBe(10);
  });

  it('descarta un registro cuyo idInspeccion no coincide con su clave', () => {
    localStorage.setItem(
      'sggdis:orden-sanitaria-en-curso:30',
      JSON.stringify(crearProgreso(99, 'Soda X'))
    );

    expect(cargarProgresoOrdenSanitaria(30)).toBeNull();
  });

  it('al limpiar una orden no activa conserva la marca de la orden activa', () => {
    guardarProgresoOrdenSanitaria(crearProgreso(10, 'Soda A'));
    guardarProgresoOrdenSanitaria(crearProgreso(20, 'Soda B'));

    limpiarProgresoOrdenSanitaria(10);

    expect(cargarProgresoOrdenSanitaria(10)).toBeNull();
    expect(existeProgresoOrdenSanitaria()).toBe(true);
    expect(cargarProgresoOrdenSanitaria().datos.idInspeccion).toBe(20);
  });

  it('al limpiar la orden activa elimina también la marca de orden activa', () => {
    guardarProgresoOrdenSanitaria(crearProgreso(10, 'Soda A'));

    limpiarProgresoOrdenSanitaria(10);

    expect(existeProgresoOrdenSanitaria()).toBe(false);
  });
});