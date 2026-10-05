/* eslint-disable react-refresh/only-export-components -- This module exports route configuration. */
import { lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROLES, useAuth } from '../auth';
import { existeProgresoOrdenSanitaria } from './progreso';
import { inspeccionPruebaOrdenSanitaria } from './datosPruebaDev';

const OrdenSanitariaModulo = lazy(() => import('./OrdenSanitariaModulo'));

function RutaOrdenSanitaria() {
  const { sesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const rutaInicio = sesion.rol === ROLES.ADMINISTRADOR ? '/admin' : '/inicio';
  const inspeccionRelacionada = location.state?.inspeccionRelacionada;
  const hayProgresoGuardado = existeProgresoOrdenSanitaria();

  // En desarrollo, si se entra a /orden-sanitaria directamente (sin venir del
  // cierre de una inspección) y no hay progreso guardado, se usan datos de
  // prueba para poder probar el módulo sin depender del flujo completo. En
  // producción import.meta.env.DEV es falso, así que esto nunca aplica.
  const datosPrueba =
    import.meta.env.DEV && !inspeccionRelacionada?.idInspeccion && !hayProgresoGuardado
      ? inspeccionPruebaOrdenSanitaria
      : undefined;

  const infoInspeccion = inspeccionRelacionada ?? datosPrueba;

  // El estado de navegación (location.state) se pierde al recargar la
  // página. Si no llega por ahí pero sí hay una Orden Sanitaria guardada en
  // localStorage, se deja continuar: OrdenSanitariaModulo recupera esa
  // inspección relacionada por su cuenta a partir del progreso guardado.
  if (!infoInspeccion?.idInspeccion && !hayProgresoGuardado) {
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
      idInspeccion={infoInspeccion?.idInspeccion}
      inspeccionRelacionada={infoInspeccion}
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