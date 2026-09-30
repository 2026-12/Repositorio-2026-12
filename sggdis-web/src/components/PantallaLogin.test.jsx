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

  it('registra una cuenta pendiente sin asignar rol desde el formulario público', async () => {
    const onRegistrar = vi.fn().mockResolvedValue({ mensaje: 'Cuenta pendiente de asignación.' });
    render(<PantallaLogin onIniciarSesion={vi.fn()} onRegistrar={onRegistrar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Crear una cuenta' }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'María' } });
    fireEvent.change(screen.getByLabelText('Primer apellido'), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText('Segundo apellido'), { target: { value: 'Solano' } });
    fireEvent.change(screen.getByLabelText('Identificación'), { target: { value: '001234567' } });
    fireEvent.change(screen.getByLabelText('Usuario institucional'), { target: { value: 'persona@misalud.go.cr' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave-inicial-segura' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(onRegistrar).toHaveBeenCalledWith({
      correo: 'persona@misalud.go.cr',
      contrasena: 'clave-inicial-segura',
      nombre: 'María',
      primerApellido: 'Pérez',
      segundoApellido: 'Solano',
      identificacion: '001234567',
    }));
    expect(await screen.findByRole('status')).toHaveTextContent('Cuenta pendiente de asignación.');
  });
});