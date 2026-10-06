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
      { idArea: 5, idRegion: 3, nombre: 'Alajuela 1', nombreRegion: 'Central Norte' },
    ]);
    adminApi.obtenerRegiones.mockResolvedValue([
      { idRegion: 2, nombre: 'Huetar Norte' },
      { idRegion: 3, nombre: 'Central Norte' },
    ]);
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
    await screen.findByText('Usuarios y asignaciones');
    expect(screen.queryByRole('heading', { name: 'Cuentas y asignaciones' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crear región' })).not.toBeInTheDocument();
    expect(screen.getByText('María Pérez Solano')).toBeInTheDocument();
    expect(screen.getByText('001234567')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Rol de persona@misalud.go.cr'), { target: { value: 'Inspector' } });
    fireEvent.click(screen.getByLabelText('Región de persona@misalud.go.cr: Huetar Norte'));
    fireEvent.click(screen.getByLabelText('Área de persona@misalud.go.cr: Florencia'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(adminApi.actualizarAsignacionUsuario).toHaveBeenCalledWith(7, {
      rol: 'Inspector',
      idArea: null,
      idRegion: null,
      idAreas: [4],
      idRegiones: [2],
    }));
  });

  it('conserva inspectores en la lista y permite reemplazar ubicaciones asignadas', async () => {
    adminApi.obtenerUsuarios.mockResolvedValue([{
      idUsuario: 8,
      correo: 'inspector@misalud.go.cr',
      nombre: 'Ana',
      primerApellido: 'Rojas',
      identificacion: '008765432',
      rol: 'Inspector',
      idAreas: [4],
      idRegiones: [2],
      activo: 'S',
    }]);
    render(<PanelAdministrador correoAdministrador="admin@misalud.go.cr" onCerrarSesion={vi.fn()} />);
    await screen.findByText('Ana Rojas');
    fireEvent.click(screen.getByText('Regiones (1)'));
    fireEvent.click(screen.getByText('Áreas (1)'));
    fireEvent.click(screen.getByLabelText('Región de inspector@misalud.go.cr: Huetar Norte'));
    fireEvent.click(screen.getByLabelText('Región de inspector@misalud.go.cr: Central Norte'));
    expect(screen.queryByLabelText('Área de inspector@misalud.go.cr: Florencia')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Área de inspector@misalud.go.cr: Alajuela 1'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(adminApi.actualizarAsignacionUsuario).toHaveBeenCalledWith(8, {
      rol: 'Inspector',
      idArea: null,
      idRegion: null,
      idAreas: [5],
      idRegiones: [3],
    }));
  });
});