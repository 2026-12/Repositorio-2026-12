import { describe, expect, it } from 'vitest';
import { construirVistaPrevia } from '../vistaPreviaInspeccion';

describe('construirVistaPrevia', () => {
  it('construye filas de solo lectura, agrupa B y resume críticos y N/A', () => {
    const datos = {
      nombre: 'Cafetería Central',
      tipoLabel: 'Restaurante',
      fecha: '05/10/2026',
      consecutivo: 'INS-10',
      idInspeccion: 10,
      puntajeMaximo: 10,
      secciones: [{ codigo: 'B1', nombre: 'Preparación' }, { codigo: 'B2', nombre: 'Cocina' }],
    };
    const seccionesCache = {
      B1: {
        codigo: 'B1',
        nombre: 'Preparación',
        items: [{ idItem: 1, descripcion: 'Lavado', articulo: 'Art. 20', puntaje: 4, esCritico: true }],
      },
      B2: {
        codigo: 'B2',
        nombre: 'Cocina',
        items: [{ idItem: 2, descripcion: 'Equipo', articulo: 'Art. 21', puntaje: 6, esCritico: false }],
      },
    };
    const respuestas = {
      1: { estado: 'No cumple', puntos: 0 },
      2: { estado: 'N/A', puntos: 0 },
    };

    const documento = construirVistaPrevia(datos, seccionesCache, respuestas, [{
      codigo: 'B',
      secciones: datos.secciones,
    }]);

    expect(documento.secciones).toHaveLength(1);
    expect(documento.secciones[0].secciones).toHaveLength(2);
    expect(documento.secciones[0].secciones[0].items[0]).toMatchObject({
      articulo: 'Art. 20',
      resultado: 'No cumple',
      criticoIncumplido: true,
    });
    expect(documento.resumen).toMatchObject({
      obtenidos: 0,
      maximo: 4,
      criticosIncumplidos: 1,
      ordenSanitariaProcede: true,
    });
  });

  it('incluye secciones aplicables cacheadas aunque todavía no estén en las vistas del wizard', () => {
    const documento = construirVistaPrevia(
      { nombre: 'Comedor', puntajeMaximo: 3, secciones: [] },
      {
        I: {
          codigo: 'I',
          nombre: 'Cierre nuevo',
          items: [{ idItem: 3, descripcion: 'Requisito nuevo', articulo: 'Art. 1', puntaje: 3 }],
        },
      },
      { 3: { estado: 'Cumple', puntos: 3 } },
    );

    expect(documento.secciones.map((seccion) => seccion.codigo)).toContain('I');
    expect(documento.resumen.obtenidos).toBe(3);
  });
});
