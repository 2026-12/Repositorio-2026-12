import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardInspeccion } from '../useWizardInspeccion';

// Cubre el criterio común a HU A-H: "habilitación de la sección siguiente al
// confirmar avance" y "no debe permitirse avanzar/saltar a secciones no alcanzadas".
describe('useWizardInspeccion', () => {
  const secciones = [
    { codigo: 'A', orden: 1 },
    { codigo: 'B1', orden: 2 },
    { codigo: 'B2', orden: 3 },
    { codigo: 'B3', orden: 4 },
    { codigo: 'D', orden: 5 },
  ];

  it('agrupa las subsecciones B1/B2/B3 en una sola vista "B"', () => {
    const { result } = renderHook(() => useWizardInspeccion(secciones));
    expect(result.current.vistas.map((v) => v.codigo)).toEqual(['A', 'B', 'D']);
    expect(result.current.vistas[1].secciones).toHaveLength(3);
  });

  it('empieza en la primera vista y no permite retroceder más allá', () => {
    const { result } = renderHook(() => useWizardInspeccion(secciones));
    expect(result.current.indice).toBe(0);
    expect(result.current.puedeRetroceder).toBe(false);
  });

  it('avanzar mueve a la siguiente vista y habilita el progreso alcanzado', () => {
    const { result } = renderHook(() => useWizardInspeccion(secciones));

    act(() => result.current.avanzar());

    expect(result.current.indice).toBe(1);
    expect(result.current.maxAlcanzado).toBe(1);
  });

  it('irAVista bloquea el salto a una vista que todavía no se ha alcanzado', () => {
    const { result } = renderHook(() => useWizardInspeccion(secciones));

    act(() => result.current.irAVista(2)); // aún no se ha llegado a la vista 2

    expect(result.current.indice).toBe(0);
  });

  it('irAVista permite regresar a una vista ya alcanzada', () => {
    const { result } = renderHook(() => useWizardInspeccion(secciones));

    act(() => result.current.avanzar());
    act(() => result.current.avanzar());
    act(() => result.current.irAVista(0));

    expect(result.current.indice).toBe(0);
    expect(result.current.maxAlcanzado).toBe(2); // no se pierde el progreso ya alcanzado
  });

  it('no avanza más allá de la última vista', () => {
    const { result } = renderHook(() => useWizardInspeccion(secciones));

    act(() => result.current.avanzar());
    act(() => result.current.avanzar());
    act(() => result.current.avanzar());
    act(() => result.current.avanzar()); // ya está en la última

    expect(result.current.indice).toBe(2);
    expect(result.current.puedeAvanzar).toBe(false);
  });
});
