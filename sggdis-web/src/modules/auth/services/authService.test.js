import { beforeEach, describe, expect, it, vi } from 'vitest';
import { iniciarSesion, renovarSesion } from './authService';

const respuestaJson = (status, cuerpo) => ({
  status,
  ok: status >= 200 && status < 300,
  json: vi.fn().mockResolvedValue(cuerpo),
});

describe('authService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('inicia sesión con credenciales incluidas y guarda el access token', async () => {
    fetch.mockResolvedValue(respuestaJson(200, {
      token: 'access-token',
      correo: 'persona@misalud.go.cr',
      rol: 'Inspector',
      expira: new Date(Date.now() + 60_000).toISOString(),
    }));

    await iniciarSesion('persona@misalud.go.cr', 'clave-segura');

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.objectContaining({
      credentials: 'include',
      method: 'POST',
    }));
    expect(sessionStorage.getItem('sggdis:sesion')).toContain('access-token');
    expect(sessionStorage.getItem('sggdis:sesion')).not.toContain('refresh');
  });

  it('actualiza la sesión access usando el endpoint de renovación', async () => {
    fetch.mockResolvedValue(respuestaJson(200, {
      token: 'rotated-access-token',
      correo: 'persona@misalud.go.cr',
      rol: 'Inspector',
      expira: new Date(Date.now() + 60_000).toISOString(),
    }));

    const sesion = await renovarSesion();

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/refresh'), expect.objectContaining({
      credentials: 'include',
      method: 'POST',
    }));
    expect(sesion.token).toBe('rotated-access-token');
    expect(JSON.parse(sessionStorage.getItem('sggdis:sesion')).token).toBe('rotated-access-token');
  });

  it('no borra un login exitoso si una renovación anterior responde 401', async () => {
    let responderRefresh;
    const refreshPendiente = new Promise((resolve) => {
      responderRefresh = resolve;
    });
    fetch.mockImplementation((url) => {
      if (url.includes('/api/auth/refresh')) return refreshPendiente;
      return Promise.resolve(respuestaJson(200, {
        token: 'new-login-token',
        correo: 'persona@misalud.go.cr',
        rol: 'Inspector',
        expira: new Date(Date.now() + 60_000).toISOString(),
      }));
    });

    const refreshAnterior = renovarSesion();
    await iniciarSesion('persona@misalud.go.cr', 'clave-segura');
    responderRefresh(respuestaJson(401, null));
    await refreshAnterior;

    expect(JSON.parse(sessionStorage.getItem('sggdis:sesion')).token).toBe('new-login-token');
  });
});