/* eslint-disable react-refresh/only-export-components -- This module exports route configuration. */
import { lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLES, ROLES_SISTEMA, useAuth } from './index';
import { useCerrarSesionNavegando } from '../../app/useCerrarSesionNavegando';

const PantallaLogin = lazy(() => import('../../components/PantallaLogin'));
const PerfilPendiente = lazy(() => import('../../components/PerfilPendiente'));
const rolesPendientes = ROLES_SISTEMA.filter((rol) => ![ROLES.ADMINISTRADOR, ROLES.INSPECTOR].includes(rol));

function RutaLogin() {
  const auth = useAuth();
  const navigate = useNavigate();

  async function manejarInicioSesion(correo, contrasena) {
    const resultado = await auth.iniciarSesion(correo, contrasena);
    void navigate('/', { replace: true });
    return resultado;
  }

  return <PantallaLogin onIniciarSesion={manejarInicioSesion} onRegistrar={auth.registrarUsuario} />;
}

function RutaPerfilPendiente() {
  const { sesion } = useAuth();
  const manejarCierreSesion = useCerrarSesionNavegando();

  return <PerfilPendiente rol={sesion.rol} onCerrarSesion={manejarCierreSesion} />;
}

export const rutasAutenticacion = [
  { path: '/login', element: <RutaLogin />, publica: true },
  { path: '/perfil-pendiente', element: <RutaPerfilPendiente />, roles: rolesPendientes },
];