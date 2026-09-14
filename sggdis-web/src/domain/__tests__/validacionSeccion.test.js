import { describe, it, expect } from 'vitest';
import { contarPendientes, obtenerPendientes } from '../validacionSeccion';

// Cubre el criterio común a HU A-H: "el sistema debe validar que todos los
// ítems obligatorios tengan una opción seleccionada antes de permitir avanzar"
// y "los mensajes de validación deben orientar sobre cuáles ítems faltan" (RNF-006).
describe('contarPendientes / obtenerPendientes', () => {
  const grupos = [
    {
      articulo: 'Art. 10',
      items: [
        { id: 1, texto: 'Abastecimiento de agua potable' },
        { id: 2, texto: 'Iluminación adecuada' },
      ],
    },
    {
      articulo: 'Art. 12',
      items: [{ id: 3, texto: 'Pisos en buen estado' }],
    },
  ];

  it('cuenta todos los ítems como pendientes cuando no hay respuestas', () => {
    expect(contarPendientes(grupos, {})).toBe(3);
  });

  it('descuenta los ítems ya respondidos', () => {
    const respuestas = { 1: { estado: 'Cumple', puntos: 1 } };
    expect(contarPendientes(grupos, respuestas)).toBe(2);
  });

  it('no permite avanzar (0 no es el resultado) mientras haya ítems obligatorios sin responder', () => {
    const respuestas = { 1: { estado: 'Cumple', puntos: 1 }, 2: { estado: 'No cumple', puntos: 0 } };
    expect(contarPendientes(grupos, respuestas)).toBe(1);
  });

  it('permite avanzar (0 pendientes) cuando todos los ítems tienen respuesta', () => {
    const respuestas = {
      1: { estado: 'Cumple', puntos: 1 },
      2: { estado: 'No cumple', puntos: 0 },
      3: { estado: 'N/A' },
    };
    expect(contarPendientes(grupos, respuestas)).toBe(0);
  });

  it('obtenerPendientes indica exactamente cuáles ítems faltan, con su artículo', () => {
    const respuestas = { 1: { estado: 'Cumple', puntos: 1 } };
    const pendientes = obtenerPendientes(grupos, respuestas);

    expect(pendientes).toHaveLength(2);
    expect(pendientes[0]).toMatchObject({ id: 2, articulo: 'Art. 10' });
    expect(pendientes[1]).toMatchObject({ id: 3, articulo: 'Art. 12' });
  });
});
