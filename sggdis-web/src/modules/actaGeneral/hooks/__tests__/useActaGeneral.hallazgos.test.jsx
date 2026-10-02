import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useActaGeneral } from '../useActaGeneral';
import {
  crearActaGeneral,
  obtenerActaGeneral,
  guardarHallazgos,
} from '../../services/actaGeneralService';

vi.mock('../../services/actaGeneralService', () => ({
  crearActaGeneral: vi.fn(),
  obtenerActaGeneral: vi.fn(),
  guardarInfoGeneral: vi.fn(),
  guardarResponsable: vi.fn(),
  guardarMotivo: vi.fn(),
  guardarHallazgos: vi.fn(),
}));

// Cubre la integración del Apartado IV (HU-009) con el flujo del Acta
// General: recuperación desde el backend, regla de "tocado" y guardado al salir.
describe('useActaGeneral - Apartado IV (Hallazgos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    crearActaGeneral.mockResolvedValue({ idActa: 1, numeroActa: '2026-00001' });
    guardarHallazgos.mockResolvedValue(null);
  });

  // Monta el hook con un acta nueva y lo deja parado en el Apartado IV.
  async function montarEnHallazgos() {
    const hook = renderHook(() => useActaGeneral());
    await waitFor(() => expect(hook.result.current.creando).toBe(false));
    await act(() => hook.result.current.irAApartado('hallazgos'));
    return hook;
  }

  it('restaura las guías (ids separados por coma) y los hallazgos del acta guardada', async () => {
    localStorage.setItem('sggdis:acta-general-activa', JSON.stringify({ idActa: 5, apartadoActivo: 'hallazgos' }));
    obtenerActaGeneral.mockResolvedValue({
      idActa: 5,
      numeroActa: '2026-00005',
      estado: 'EN_PROCESO',
      guiasAplicables: '1,3',
      hallazgos: 'Campana con grasa acumulada.',
    });

    const { result } = renderHook(() => useActaGeneral());
    await waitFor(() => expect(result.current.creando).toBe(false));

    expect(result.current.apartadoActivo).toBe('hallazgos');
    expect(result.current.hallazgos).toEqual({ idsGuias: [1, 3], hallazgos: 'Campana con grasa acumulada.' });
    expect(result.current.estadoApartados.hallazgos).toBe('completo');
    expect(crearActaGeneral).not.toHaveBeenCalled();
  });

  it('permite salir sin guardar si el apartado no se tocó', async () => {
    const { result } = await montarEnHallazgos();

    await act(() => result.current.avanzarAlSiguienteApartado());

    expect(result.current.apartadoActivo).toBe('acciones');
    expect(guardarHallazgos).not.toHaveBeenCalled();
  });

  it('no deja salir si se empezó a llenar y falta seleccionar una guía', async () => {
    const { result } = await montarEnHallazgos();

    act(() => result.current.actualizarCampoHallazgos('hallazgos', 'Campana con grasa acumulada.'));
    await act(() => result.current.avanzarAlSiguienteApartado());

    expect(result.current.apartadoActivo).toBe('hallazgos');
    expect(result.current.erroresHallazgos.idsGuias).toBeDefined();
    expect(guardarHallazgos).not.toHaveBeenCalled();
  });

  it('guarda las guías seleccionadas y los hallazgos al avanzar', async () => {
    const { result } = await montarEnHallazgos();

    act(() => result.current.actualizarCampoHallazgos('idsGuias', [1]));
    act(() => result.current.actualizarCampoHallazgos('hallazgos', 'Campana con grasa acumulada.'));
    await act(() => result.current.avanzarAlSiguienteApartado());

    expect(guardarHallazgos).toHaveBeenCalledWith(1, { idsGuias: [1], hallazgos: 'Campana con grasa acumulada.' });
    expect(result.current.apartadoActivo).toBe('acciones');
  });

  it('muestra el error del backend y se queda en el apartado si el guardado falla', async () => {
    guardarHallazgos.mockRejectedValue(new Error('Alguna de las guías seleccionadas no existe.'));
    const { result } = await montarEnHallazgos();

    act(() => result.current.actualizarCampoHallazgos('idsGuias', [99]));
    act(() => result.current.actualizarCampoHallazgos('hallazgos', 'Hallazgo'));
    await act(() => result.current.avanzarAlSiguienteApartado());

    expect(result.current.errorGuardado).toBe('Alguna de las guías seleccionadas no existe.');
    expect(result.current.apartadoActivo).toBe('hallazgos');
  });
});
