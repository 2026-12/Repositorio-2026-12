import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useActaGeneral } from '../useActaGeneral';
import {
  crearActaGeneral,
  guardarHallazgos,
  guardarCierre,
  enviarActaGeneral,
} from '../../services/actaGeneralService';

vi.mock('../../services/actaGeneralService', () => ({
  crearActaGeneral: vi.fn(),
  obtenerActaGeneral: vi.fn(),
  guardarInfoGeneral: vi.fn(),
  guardarResponsable: vi.fn(),
  guardarMotivo: vi.fn(),
  guardarHallazgos: vi.fn(),
  guardarAcciones: vi.fn(),
  guardarCierre: vi.fn(),
  enviarActaGeneral: vi.fn(),
}));

// Cubre la navegación según los datos actuales de cada apartado (un apartado
// que se llena y después se vacía vuelve a permitir navegar), el botón
// "Finalizar" del último apartado y el envío del acta desde la vista previa.
describe('useActaGeneral - navegación, finalizar y envío', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    crearActaGeneral.mockResolvedValue({ idActa: 1, numeroActa: '2026-00001' });
    guardarHallazgos.mockResolvedValue(null);
    guardarCierre.mockResolvedValue(null);
    enviarActaGeneral.mockResolvedValue(null);
  });

  async function montar() {
    const hook = renderHook(() => useActaGeneral());
    await waitFor(() => expect(hook.result.current.creando).toBe(false));
    return hook;
  }

  // Llena con datos válidos los seis apartados (sin pasar por la navegación).
  function llenarTodo(result) {
    act(() => {
      const r = result.current;
      r.actualizarCampoInfoGeneral('nombreComercial', 'Soda La Esquina');
      r.actualizarCampoInfoGeneral('provincia', 'San José');
    });
    act(() => result.current.actualizarCampoInfoGeneral('canton', 'Escazú'));
    act(() => {
      const r = result.current;
      r.actualizarCampoInfoGeneral('distrito', 'San Rafael');
      r.actualizarCampoInfoGeneral('direccionExacta', '100 m norte de la iglesia');
      r.actualizarCampoInfoGeneral('correoNotificaciones', 'soda@correo.com');
      r.actualizarCampoResponsable('nombreResponsable', 'Luis Mora');
      r.actualizarCampoResponsable('cargoResponsable', ['ENCARGADO']);
      r.actualizarCampoResponsable('numeroIdentificacionResponsable', '111111111');
      r.actualizarCampoMotivo('motivoInspeccion', ['SEGUIMIENTO']);
      r.actualizarCampoHallazgos('idsGuias', [1]);
      r.actualizarCampoHallazgos('hallazgos', 'Sin hallazgos relevantes.');
      r.actualizarCampoAcciones('acciones', ['CIERRE_CASO']);
      r.agregarPersonaPresente();
    });
    const idPersona = result.current.cierre.personasPresentes[0].id;
    act(() => {
      const r = result.current;
      r.actualizarPersonaPresente(idPersona, 'nombreCompleto', 'Luis Mora');
      r.actualizarPersonaPresente(idPersona, 'cargoInstitucion', 'Encargado');
      r.actualizarPersonaPresente(idPersona, 'numeroIdentificacion', '111111111');
      r.actualizarPersonaPresente(idPersona, 'firma', 'L. Mora');
    });
  }

  it('si el apartado se llena y después se borra todo, vuelve a permitir navegar', async () => {
    const { result } = await montar();
    await act(() => result.current.irAApartado('hallazgos'));

    act(() => result.current.actualizarCampoHallazgos('hallazgos', 'Texto'));
    await act(() => result.current.avanzarAlSiguienteApartado());
    expect(result.current.apartadoActivo).toBe('hallazgos');

    act(() => result.current.actualizarCampoHallazgos('hallazgos', ''));
    await act(() => result.current.avanzarAlSiguienteApartado());

    expect(result.current.apartadoActivo).toBe('acciones');
    expect(result.current.erroresHallazgos).toEqual({});
    // Se guarda vacío para que la BD no conserve datos que ya se borraron.
    expect(guardarHallazgos).toHaveBeenCalledWith(1, { idsGuias: [], hallazgos: '' });
  });

  it('una persona agregada sin datos no bloquea la salida del Cierre ni se guarda', async () => {
    const { result } = await montar();
    await act(() => result.current.irAApartado('cierre'));

    act(() => result.current.agregarPersonaPresente());
    await act(() => result.current.retrocederAlApartadoAnterior());

    expect(result.current.apartadoActivo).toBe('acciones');
    expect(guardarCierre).toHaveBeenCalledWith(1, { personasPresentes: [] });
  });

  it('"Finalizar" lleva al primer apartado incompleto si falta algo', async () => {
    const { result } = await montar();
    llenarTodo(result);
    act(() => result.current.actualizarCampoMotivo('motivoInspeccion', []));
    await act(() => result.current.irAApartado('cierre'));

    await act(() => result.current.avanzarAlSiguienteApartado());

    expect(result.current.apartadoActivo).toBe('motivo');
    expect(result.current.erroresMotivo.motivoInspeccion).toBeDefined();
    expect(result.current.avisoValidacion).toEqual({ primerCampo: 'motivoInspeccion' });
  });

  it('"Finalizar" con todo completo muestra la vista previa y desde ahí se envía el acta', async () => {
    const { result } = await montar();
    llenarTodo(result);
    await act(() => result.current.irAApartado('cierre'));

    await act(() => result.current.avanzarAlSiguienteApartado());
    expect(result.current.apartadoActivo).toBe('vista-previa');
    expect(enviarActaGeneral).not.toHaveBeenCalled();

    await act(() => result.current.enviarActa());

    expect(enviarActaGeneral).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        infoGeneral: expect.objectContaining({ nombreComercial: 'Soda La Esquina' }),
        motivo: expect.objectContaining({ motivoInspeccion: ['SEGUIMIENTO'] }),
        cierre: expect.objectContaining({ personasPresentes: expect.any(Array) }),
      })
    );
    expect(result.current.enviada).toBe(true);
    expect(localStorage.getItem('sggdis:acta-general-activa')).toBeNull();
  });

  it('si el envío falla muestra el error y sigue en la vista previa', async () => {
    enviarActaGeneral.mockRejectedValue(new Error('El acta ya fue enviada.'));
    const { result } = await montar();
    llenarTodo(result);
    await act(() => result.current.irAApartado('cierre'));
    await act(() => result.current.avanzarAlSiguienteApartado());

    await act(() => result.current.enviarActa());

    expect(result.current.errorEnvio).toBe('El acta ya fue enviada.');
    expect(result.current.enviada).toBe(false);
    expect(result.current.apartadoActivo).toBe('vista-previa');
  });
});
