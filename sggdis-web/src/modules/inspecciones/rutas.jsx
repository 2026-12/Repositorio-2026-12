/* eslint-disable react-refresh/only-export-components -- This module exports route configuration. */
import { lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLES, useAuth } from '../auth';
import { useCerrarSesionNavegando } from '../../app/useCerrarSesionNavegando';

const PantallaInicio = lazy(() => import('../../components/PantallaInicio'));
const InspeccionModulo = lazy(() => import('./InspeccionModulo'));

function RutaInicioInspector() {
  const navigate = useNavigate();
  const manejarCierreSesion = useCerrarSesionNavegando();

  return (
    <PantallaInicio
      onNuevaInspeccion={() => navigate('/inspeccion')}
      onCerrarSesion={manejarCierreSesion}
    />
  );
}

function RutaInspeccion() {
  const { sesion } = useAuth();
  const navigate = useNavigate();

  return (
    <InspeccionModulo
      onVolverInicio={() => navigate('/inicio')}
      onCrearOrdenSanitaria={(inspeccionRelacionada) =>
        navigate('/orden-sanitaria', { state: { inspeccionRelacionada } })
      }
      sesion={sesion}
    />
  );
}

export const rutasInspecciones = [
  { path: '/inicio', element: <RutaInicioInspector />, roles: [ROLES.INSPECTOR] },
  { path: '/inspeccion', element: <RutaInspeccion />, roles: [ROLES.INSPECTOR] },
];