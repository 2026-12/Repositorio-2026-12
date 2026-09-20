import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRespuestasInspeccion } from '../useRespuestasInspeccion';

// Cubre el criterio común a HU A-H: "cada ítem debe presentarse con
// exactamente dos opciones mutuamente excluyentes (Cumple / No cumple)...
// al seleccionar Cumple, el sistema asigna automáticamente el valor indicado;
// al seleccionar No cumple, asigna 0."
describe('useRespuestasInspeccion', () => {
  const grupos = [
    { articulo: 'Art. 10', items: [{ id: 1, valor: 8, critico: true }, { id: 2, valor: 4, critico: false }] },
  ];

  it('al marcar "Cumple" asigna automáticamente el valor máximo del ítem', () => {
    const { result } = renderHook(() => useRespuestasInspeccion(grupos));

    act(() => result.current.alternarRespuesta(1, 'Cumple', 8));

    expect(result.current.respuestas[1]).toEqual({ estado: 'Cumple', puntos: 8 });
  });

  it('al marcar "No cumple" asigna automáticamente 0 puntos', () => {
    const { result } = renderHook(() => useRespuestasInspeccion(grupos));

    act(() => result.current.alternarRespuesta(1, 'No cumple', 8));

    expect(result.current.respuestas[1]).toEqual({ estado: 'No cumple', puntos: 0 });
  });

  it('las opciones son mutuamente excluyentes: marcar "No cumple" reemplaza un "Cumple" previo', () => {
    const { result } = renderHook(() => useRespuestasInspeccion(grupos));

    act(() => result.current.alternarRespuesta(1, 'Cumple', 8));
    act(() => result.current.alternarRespuesta(1, 'No cumple', 8));

    expect(result.current.respuestas[1]).toEqual({ estado: 'No cumple', puntos: 0 });
  });

  it('volver a pulsar la misma opción la deselecciona (queda sin responder)', () => {
    const { result } = renderHook(() => useRespuestasInspeccion(grupos));

    act(() => result.current.alternarRespuesta(1, 'Cumple', 8));
    act(() => result.current.alternarRespuesta(1, 'Cumple', 8));

    expect(result.current.respuestas[1]).toBeUndefined();
  });

  it('actualizarPuntos permite ajustar el puntaje parcial otorgado a un ítem ya marcado "Cumple"', () => {
    const { result } = renderHook(() => useRespuestasInspeccion(grupos));

    act(() => result.current.alternarRespuesta(1, 'Cumple', 8));
    act(() => result.current.actualizarPuntos(1, 3));

    expect(result.current.respuestas[1].puntos).toBe(3);
  });

  it('no acepta 0 puntos para un ítem marcado como "Cumple" porque es redundante con "No cumple"', () => {
    const { result } = renderHook(() => useRespuestasInspeccion(grupos));

    act(() => result.current.alternarRespuesta(1, 'Cumple', 8));
    act(() => result.current.actualizarPuntos(1, 0));

    expect(result.current.respuestas[1].puntos).toBe(1);
  });

  it('el resumen se recalcula en tiempo real conforme cambian las respuestas', () => {
    const { result } = renderHook(() => useRespuestasInspeccion(grupos));

    expect(result.current.resumen.obtenidos).toBe(0);
    act(() => result.current.alternarRespuesta(1, 'Cumple', 8));
    expect(result.current.resumen.obtenidos).toBe(8);
    act(() => result.current.alternarRespuesta(2, 'No cumple', 4));
    expect(result.current.resumen.obtenidos).toBe(8);
  });

  it('modo controlado: notifica los cambios al padre en vez de guardar estado propio', () => {
    let respuestasPadre = {};
    const onRespuestasChange = (actualizar) => {
      respuestasPadre = typeof actualizar === 'function' ? actualizar(respuestasPadre) : actualizar;
    };

    const { result, rerender } = renderHook(
      ({ respuestas }) => useRespuestasInspeccion(grupos, respuestas, onRespuestasChange),
      { initialProps: { respuestas: respuestasPadre } },
    );

    act(() => result.current.alternarRespuesta(1, 'Cumple', 8));
    rerender({ respuestas: respuestasPadre });

    expect(respuestasPadre[1]).toEqual({ estado: 'Cumple', puntos: 8 });
  });
});
