/* eslint-disable react-refresh/only-export-components -- This module exports route configuration. */
import { lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLES } from '../auth';
import { useAuth } from '../auth';

const ActaGeneralModulo = lazy(() => import('./components/ActaGeneralModulo'));

function RutaActaGeneral() {
  const { sesion } = useAuth();
  const navigate = useNavigate();
  const rutaInicio = sesion.rol === ROLES.ADMINISTRADOR ? '/admin' : '/inicio';

  return <ActaGeneralModulo onVolverInicio={() => navigate(rutaInicio)} />;
}

export const rutasActaGeneral = [
  {
    path: '/acta-general',
    element: <RutaActaGeneral />,
    roles: [ROLES.INSPECTOR, ROLES.ADMINISTRADOR],
  },
];