import { describe, it, expect } from 'vitest';
import { agruparPorArticulo } from '../agrupacionItems';

// Cubre el criterio común a HU A-H: "los ítems deben presentarse agrupados
// por artículo, en el mismo orden que el formulario oficial del Anexo 9".
describe('agruparPorArticulo', () => {
  it('agrupa ítems consecutivos del mismo artículo en un solo grupo', () => {
    const items = [
      { idItem: 1, descripcion: 'Item 1', puntaje: 5, articulo: 'Art. 10', esCritico: false },
      { idItem: 2, descripcion: 'Item 2', puntaje: 3, articulo: 'Art. 10', esCritico: false },
      { idItem: 3, descripcion: 'Item 3', puntaje: 2, articulo: 'Art. 12', esCritico: false },
    ];

    const grupos = agruparPorArticulo(items);

    expect(grupos).toHaveLength(2);
    expect(grupos[0].articulo).toBe('Art. 10');
    expect(grupos[0].items).toHaveLength(2);
    expect(grupos[1].articulo).toBe('Art. 12');
    expect(grupos[1].items).toHaveLength(1);
  });

  it('conserva el orden original de los ítems recibidos', () => {
    const items = [
      { idItem: 1, descripcion: 'A', puntaje: 1, articulo: 'Art. 1', esCritico: false },
      { idItem: 2, descripcion: 'B', puntaje: 1, articulo: 'Art. 2', esCritico: false },
      { idItem: 3, descripcion: 'C', puntaje: 1, articulo: 'Art. 1', esCritico: false },
    ];

    // Como no vienen ordenados por artículo, se abren dos grupos separados
    // de "Art. 1" en vez de fusionarse (el orden del backend manda).
    const grupos = agruparPorArticulo(items);
    expect(grupos.map((g) => g.articulo)).toEqual(['Art. 1', 'Art. 2', 'Art. 1']);
  });

  it('mapea correctamente los campos del ítem (id, texto, valor, crítico, noAplica)', () => {
    const items = [
      { idItem: 10, descripcion: 'Abastecimiento de agua potable', puntaje: 8, articulo: 'Art. 10', esCritico: true, permiteNoAplica: false },
      { idItem: 11, descripcion: 'Contenedores térmicos', puntaje: 4, articulo: 'Art. 20', esCritico: false, permiteNoAplica: 'S' },
    ];

    const [grupo1, grupo2] = agruparPorArticulo(items);

    expect(grupo1.items[0]).toMatchObject({
      id: 10,
      texto: 'Abastecimiento de agua potable',
      valor: 8,
      critico: true,
      noAplica: false,
    });
    expect(grupo2.items[0]).toMatchObject({ id: 11, noAplica: true });
  });

  it('devuelve una lista vacía cuando no hay ítems', () => {
    expect(agruparPorArticulo([])).toEqual([]);
    expect(agruparPorArticulo()).toEqual([]);
  });
});
