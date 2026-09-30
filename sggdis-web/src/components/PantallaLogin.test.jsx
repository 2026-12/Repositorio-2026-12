import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PantallaLogin from './PantallaLogin';

describe('PantallaLogin', () => {
  it('envía credenciales directamente y permite alternar la visibilidad de contraseña', async () => {
    const onIniciarSesion = vi.fn().mockResolvedValue({ token: 'sesion-valida' });
    render(<PantallaLogin onIniciarSesion={onIniciarSesion} />);

    fireEvent.change(screen.getByLabelText('Usuario institucional'), { target: { value: 'inspectora@misalud.go.cr' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
    await waitFor(() => expect(onIniciarSesion).toHaveBeenCalledWith('inspectora@misalud.go.cr', 'secreto'));
    expect(screen.queryByLabelText('Código de verificación')).not.toBeInTheDocument();
  });

  it('muestra el error de credenciales sin abandonar el formulario', async () => {
    const onIniciarSesion = vi.fn().mockRejectedValue(new Error('Correo o contraseña incorrectos.'));
    render(<PantallaLogin onIniciarSesion={onIniciarSesion} />);

    fireEvent.change(screen.getByLabelText('Usuario institucional'), { target: { value: 'usuario@misalud.go.cr' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'incorrecta' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
  });

  it('informa que debe esperar cuando el administrador aún no asignó rol o área', async () => {
    const onIniciarSesion = vi.fn().mockRejectedValue(new Error('Su rol y/o área de trabajo aún no están asignados. Debe esperar a que el Administrador complete la asignación.'));
    render(<PantallaLogin onIniciarSesion={onIniciarSesion} />);
    fireEvent.change(screen.getByLabelText('Usuario institucional'), { target: { value: 'persona@misalud.go.cr' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreto' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Debe esperar');
  });

  it('no ofrece registro público de cuentas desde la pantalla de login', () => {
    render(<PantallaLogin onIniciarSesion={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Crear cuenta/ })).not.toBeInTheDocument();
  });
});