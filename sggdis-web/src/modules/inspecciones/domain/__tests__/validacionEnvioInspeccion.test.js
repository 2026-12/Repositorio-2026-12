import { describe, expect, it } from 'vitest';
import { validarInspeccionCompleta } from '../validacionEnvioInspeccion';

describe('validarInspeccionCompleta', () => {
  it('reporta cada pendiente con artículo, texto y su subsección', () => {
    const errores = validarInspeccionCompleta(
      [{ codigo: 'B', nombre: 'Cocina', secciones: [{ codigo: 'B1', nombre: 'Preparación' }] }],
      {
        B1: {
          codigo: 'B1',
          items: [
            { idItem: 5, descripcion: 'Mantener limpia la superficie', articulo: 'Art. 25', puntaje: 2 },
          ],
        },
      },
      {},
    );

    expect(errores[0].codigo).toBe('B');
    expect(errores[0].secciones[0]).toMatchObject({
      codigo: 'B1',
      nombre: 'Preparación',
      incompleta: false,
    });
    expect(errores[0].secciones[0].pendientes[0]).toMatchObject({
      id: 5,
      articulo: 'Art. 25',
      texto: 'Mantener limpia la superficie',
    });
  });

  it('marca como incompleta una sección que no pudo cargarse', () => {
    const errores = validarInspeccionCompleta(
      [{ codigo: 'H', secciones: [{ codigo: 'H', nombre: 'Catering' }] }],
      {},
      {},
    );

    expect(errores[0].secciones[0]).toMatchObject({
      codigo: 'H',
      nombre: 'Catering',
      incompleta: true,
      pendientes: [],
    });
  });
});
