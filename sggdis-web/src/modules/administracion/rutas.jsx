/* eslint-disable react-refresh/only-export-components -- This module exports route configuration. */
import { lazy } from 'react';
import { ROLES, useAuth } from '../auth';
import { useCerrarSesionNavegando } from '../../app/useCerrarSesionNavegando';

const PanelAdministrador = lazy(() => import('./components/PanelAdministrador'));

function RutaPanelAdministrador() {
  const { sesion } = useAuth();
  const manejarCierreSesion = useCerrarSesionNavegando();

  return <PanelAdministrador correoAdministrador={sesion.correo} onCerrarSesion={manejarCierreSesion} />;
}

export const rutasAdministracion = [
  { path: '/admin', element: <RutaPanelAdministrador />, roles: [ROLES.ADMINISTRADOR] },
];