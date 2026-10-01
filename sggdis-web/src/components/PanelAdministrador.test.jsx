import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PanelAdministrador from '../modules/administracion/components/PanelAdministrador';

const adminApi = vi.hoisted(() => ({
  obtenerAreas: vi.fn(),
  obtenerRegiones: vi.fn(),
  obtenerUsuarios: vi.fn(),
  actualizarAsignacionUsuario: vi.fn(),
}));

vi.mock('../modules/administracion/services/administracionService', () => adminApi);

describe('PanelAdministrador', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.obtenerAreas.mockResolvedValue([
      { idArea: 4, idRegion: 2, nombre: 'Florencia', nombreRegion: 'Huetar Norte' },
    ]);
    adminApi.obtenerRegiones.mockResolvedValue([{ idRegion: 2, nombre: 'Huetar Norte' }]);
    adminApi.obtenerUsuarios.mockResolvedValue([{
      idUsuario: 7,
      correo: 'persona@misalud.go.cr',
      nombre: 'María',
      primerApellido: 'Pérez',
      segundoApellido: 'Solano',
      identificacion: '001234567',
      rol: 'Pendiente',
      activo: 'S',
    }]);
  });

  it('asigna rol y ubicación de forma secuencial a una cuenta pendiente', async () => {
    render(<PanelAdministrador correoAdministrador="admin@misalud.go.cr" onCerrarSesion={vi.fn()} />);
    await screen.findByRole('option', { name: 'Huetar Norte' });
    expect(screen.queryByRole('button', { name: 'Crear región' })).not.toBeInTheDocument();
    expect(screen.getByText('María Pérez Solano')).toBeInTheDocument();
    expect(screen.getByText('001234567')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Rol de persona@misalud.go.cr'), { target: { value: 'Inspector' } });
    fireEvent.change(screen.getByLabelText('Región de persona@misalud.go.cr'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Área de persona@misalud.go.cr'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(adminApi.actualizarAsignacionUsuario).toHaveBeenCalledWith(7, 'Inspector', 4, 2));
  });
});