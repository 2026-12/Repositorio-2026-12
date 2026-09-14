import { describe, it, expect } from 'vitest';
import { calcularResumen } from '../calculoPuntaje';

// Cubre el criterio común a HU A-H: "el puntaje parcial de la sección debe
// calcularse y actualizarse en tiempo real" y la exclusión de ítems N/A.
describe('calcularResumen', () => {
  const grupos = [
    {
      articulo: 'Art. 10',
      items: [
        { id: 1, valor: 8, critico: true },
        { id: 2, valor: 4, critico: false },
      ],
    },
    {
      articulo: 'Art. 20',
      items: [
        { id: 3, valor: 6, critico: false },
      ],
    },
  ];

  it('devuelve 0/máximo total cuando no hay respuestas', () => {
    const resumen = calcularResumen(grupos, {});
    expect(resumen).toEqual({ obtenidos: 0, maximo: 18, criticosIncumplidos: 0 });
  });

  it('suma los puntos otorgados solo de los ítems marcados "Cumple"', () => {
    const respuestas = {
      1: { estado: 'Cumple', puntos: 8 },
      2: { estado: 'No cumple', puntos: 0 },
    };
    const resumen = calcularResumen(grupos, respuestas);
    expect(resumen.obtenidos).toBe(8);
    expect(resumen.maximo).toBe(18); // el máximo no cambia, solo lo obtenido
  });

  it('un ítem marcado "N/A" no cuenta ni para obtenidos ni para el máximo', () => {
    const respuestas = { 3: { estado: 'N/A' } };
    const resumen = calcularResumen(grupos, respuestas);
    expect(resumen.maximo).toBe(12); // 18 - 6 (excluido por N/A)
    expect(resumen.obtenidos).toBe(0);
  });

  it('cuenta los ítems críticos marcados "No cumple" (dispara advertencia)', () => {
    const respuestas = { 1: { estado: 'No cumple', puntos: 0 } };
    const resumen = calcularResumen(grupos, respuestas);
    expect(resumen.criticosIncumplidos).toBe(1);
  });

  it('no cuenta como crítico incumplido un ítem crítico marcado "Cumple"', () => {
    const respuestas = { 1: { estado: 'Cumple', puntos: 8 } };
    const resumen = calcularResumen(grupos, respuestas);
    expect(resumen.criticosIncumplidos).toBe(0);
  });

  it('respeta puntaje parcial (menor al valor máximo del ítem) otorgado por el inspector', () => {
    const respuestas = { 1: { estado: 'Cumple', puntos: 3 } };
    const resumen = calcularResumen(grupos, respuestas);
    expect(resumen.obtenidos).toBe(3);
  });
});
