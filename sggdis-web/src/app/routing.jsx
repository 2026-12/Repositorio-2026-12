import { Navigate } from 'react-router-dom';
import { ROLES, useAuth } from '../modules/auth';
import { existeProgresoGuardado } from '../modules/inspecciones/progreso';

function obtenerRutaSesion(sesion) {
  if (!sesion) return '/login';
  if (sesion.rol === ROLES.ADMINISTRADOR) return '/admin';
  if (sesion.rol === ROLES.INSPECTOR) {
    return existeProgresoGuardado() ? '/inspeccion' : '/inicio';
  }
  return '/perfil-pendiente';
}

export function RutaInicial() {
  const { sesion } = useAuth();

  return <Navigate to={obtenerRutaSesion(sesion)} replace />;
}

export function RutaProtegida({ roles, publica = false, children }) {
  const { sesion } = useAuth();
  const rutaSesion = obtenerRutaSesion(sesion);

  if (publica) {
    return sesion ? <Navigate to={rutaSesion} replace /> : children;
  }

  if (!sesion || !roles.includes(sesion.rol)) {
    return <Navigate to={rutaSesion} replace />;
  }

  return children;
}