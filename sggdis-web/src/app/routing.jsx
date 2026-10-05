import { Navigate } from 'react-router-dom';
import { ROLES, useAuth } from '../modules/auth';
import { existeProgresoGuardado } from '../modules/inspecciones/progreso';
import { existeProgresoOrdenSanitaria } from '../modules/ordenSanitaria/progreso';

function obtenerRutaSesion(sesion) {
  if (!sesion) return '/login';
  if (sesion.rol === ROLES.ADMINISTRADOR) return '/admin';
  if (sesion.rol === ROLES.INSPECTOR) {
    // Igual que antes de la migración a rutas: si hay una inspección a
    // medias se retoma primero; si no, pero hay una Orden Sanitaria
    // pendiente, se retoma esa.
    if (existeProgresoGuardado()) return '/inspeccion';
    if (existeProgresoOrdenSanitaria()) return '/orden-sanitaria';
    return '/inicio';
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