import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PanelAdministrador from './PanelAdministrador';

const adminApi = vi.hoisted(() => ({
  obtenerAreas: vi.fn(),
  obtenerUsuarios: vi.fn(),
  crearUsuarioAdministrador: vi.fn(),
  actualizarAsignacionUsuario: vi.fn(),
}));

vi.mock('../modules/auth/services/adminUsuariosService', () => adminApi);

describe('PanelAdministrador', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.obtenerAreas.mockResolvedValue([
      { idArea: 4, nombre: 'Florencia', nombreRegion: 'Huetar Norte' },
    ]);
    adminApi.obtenerUsuarios.mockResolvedValue([]);
    adminApi.crearUsuarioAdministrador.mockResolvedValue({});
  });

  it('permite al Administrador crear Inspector con área asignada', async () => {
    render(<PanelAdministrador correoAdministrador="admin@misalud.go.cr" onCerrarSesion={vi.fn()} />);
    await screen.findByRole('option', { name: 'Huetar Norte / Florencia' });
    fireEvent.change(screen.getByLabelText('Correo institucional'), { target: { value: 'inspector@misalud.go.cr' } });
    fireEvent.change(screen.getByLabelText('Contraseña inicial'), { target: { value: 'clave-inicial-segura' } });
    fireEvent.change(screen.getByLabelText('Área de trabajo *'), { target: { value: '4' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Crear usuario' }).closest('form'));

    await waitFor(() => expect(adminApi.crearUsuarioAdministrador).toHaveBeenCalledWith({
      correo: 'inspector@misalud.go.cr',
      contrasena: 'clave-inicial-segura',
      rol: 'Inspector',
      idArea: '4',
    }));
  });
});