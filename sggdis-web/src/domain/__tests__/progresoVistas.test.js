import { describe, it, expect } from 'vitest';
import { contarProgresoVista, esVistaCompleta } from '../progresoVistas';

// Cubre el criterio común a HU A-H: "indicador de progreso visible... señalando
// ítems completados y pendientes" y la habilitación de la sección siguiente.
describe('contarProgresoVista / esVistaCompleta', () => {
  const seccionesCache = {
    B1: { items: [{ idItem: 1 }, { idItem: 2 }] },
    B2: { items: [{ idItem: 3 }] },
  };
  const vistaB = { codigo: 'B', secciones: [{ codigo: 'B1' }, { codigo: 'B2' }] };

  it('cuenta el total y los contestados a través de todas las subsecciones de la vista', () => {
    const respuestas = { 1: { estado: 'Cumple', puntos: 1 } };
    expect(contarProgresoVista(vistaB, seccionesCache, respuestas)).toEqual({ total: 3, contestados: 1 });
  });

  it('una vista sin datos cacheados todavía reporta total 0', () => {
    const vistaSinCache = { codigo: 'X', secciones: [{ codigo: 'X1' }] };
    expect(contarProgresoVista(vistaSinCache, {}, {})).toEqual({ total: 0, contestados: 0 });
  });

  it('esVistaCompleta es false si faltan ítems por responder', () => {
    const respuestas = { 1: { estado: 'Cumple', puntos: 1 } };
    expect(esVistaCompleta(vistaB, seccionesCache, respuestas)).toBe(false);
  });

  it('esVistaCompleta es false si la sección aún no se ha cargado (total 0)', () => {
    expect(esVistaCompleta({ codigo: 'B', secciones: [{ codigo: 'B1' }] }, {}, {})).toBe(false);
  });

  it('esVistaCompleta es true solo cuando todos los ítems tienen respuesta', () => {
    const respuestas = {
      1: { estado: 'Cumple', puntos: 1 },
      2: { estado: 'No cumple', puntos: 0 },
      3: { estado: 'N/A' },
    };
    expect(esVistaCompleta(vistaB, seccionesCache, respuestas)).toBe(true);
  });
});
