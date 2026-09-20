import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCierreInspeccion } from '../useCierreInspeccion';

// Cubre HU I: puntaje total antes del cierre, campos obligatorios, bloqueo de
// envío si faltan secciones, y no bloqueo de la orden sanitaria por buen puntaje.
describe('useCierreInspeccion', () => {
  const seccionesCache = { A: { items: [{ idItem: 1, puntaje: 100 }] } };
  const vistas = [{ codigo: 'A', secciones: [{ codigo: 'A' }] }];

  function setup(respuestas = {}, puntajeMaximoTipo = 152) {
    return renderHook(() =>
      useCierreInspeccion({ vistas, seccionesCache, respuestas, puntajeMaximoTipo }),
    );
  }

  it('no permite enviar si la sección aún no está completa', () => {
    const { result } = setup({});
    expect(result.current.seccionesCompletas).toBe(false);
    expect(result.current.puedeEnviar).toBe(false);
  });

  it('no permite enviar si faltan campos obligatorios del cierre, aunque las secciones estén completas', () => {
    const { result } = setup({ 1: { estado: 'Cumple', puntos: 100 } });
    expect(result.current.seccionesCompletas).toBe(true);
    expect(result.current.camposPendientes.length).toBeGreaterThan(0);
    expect(result.current.puedeEnviar).toBe(false);
  });

  it('permite enviar cuando las secciones y los campos obligatorios están completos', () => {
    const { result } = setup({ 1: { estado: 'Cumple', puntos: 100 } });

    // Sin guiones: la identificación validada solo acepta dígitos (ver
    // 'rechaza identificaciones con letras, guiones o símbolos' más abajo).
    act(() => result.current.actualizarCampo('nombreInspector', 'Ana'));
    act(() => result.current.actualizarCampo('identificacionInspector', '111111111'));
    act(() => result.current.actualizarCampo('identificacionRepresentante', '222222222'));

    expect(result.current.camposPendientes).toEqual([]);
    expect(result.current.puedeEnviar).toBe(true);
  });

  it('calcula el porcentaje y la clasificación a partir del puntaje obtenido', () => {
    const { result } = setup({ 1: { estado: 'Cumple', puntos: 100 } }, 100);
    expect(result.current.porcentaje).toBe(100);
    expect(result.current.clasificacion.etiqueta).toBe('Buenas condiciones');
  });

  it('la orden sanitaria puede marcarse aunque la clasificación sea "Buenas condiciones" (Art. 65)', () => {
    const { result } = setup({ 1: { estado: 'Cumple', puntos: 100 } }, 100);

    act(() => result.current.actualizarCampo('ordenSanitaria', true));

    expect(result.current.clasificacion.etiqueta).toBe('Buenas condiciones');
    expect(result.current.datosCierre.ordenSanitaria).toBe(true);
    // Marcar la orden sanitaria no depende de ni es bloqueado por el puntaje/clasificación.
    expect(result.current.camposPendientes).not.toContain('ordenSanitaria');
  });
});
