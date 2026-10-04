/* eslint-disable react-refresh/only-export-components -- This module exports route configuration. */
import { lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROLES, useAuth } from '../auth';

const OrdenSanitariaModulo = lazy(() => import('./OrdenSanitariaModulo'));

function RutaOrdenSanitaria() {
  const { sesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const rutaInicio = sesion.rol === ROLES.ADMINISTRADOR ? '/admin' : '/inicio';
  const inspeccionRelacionada = location.state?.inspeccionRelacionada;

  if (!inspeccionRelacionada?.idInspeccion) {
    return (
      <main role="alert">
        <h1>Se requiere una inspección relacionada</h1>
        <p>Abra la Orden Sanitaria desde el cierre de la inspección que desea asociar.</p>
        <button type="button" onClick={() => navigate(rutaInicio)}>Volver</button>
      </main>
    );
  }

  return (
    <OrdenSanitariaModulo
      idInspeccion={inspeccionRelacionada.idInspeccion}
      inspeccionRelacionada={inspeccionRelacionada}
      onVolverInicio={() => navigate(rutaInicio)}
    />
  );
}

export const rutasOrdenSanitaria = [
  {
    path: '/orden-sanitaria',
    element: <RutaOrdenSanitaria />,
    roles: [ROLES.INSPECTOR, ROLES.ADMINISTRADOR],
  },
];