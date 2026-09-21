import { useCallback, useEffect, useState } from 'react';
import { guardarRespuestas } from '../services/inspeccionesService';

// Compara respuestas actuales contra las guardadas y devuelve solo las que
// cambiaron. Así el autoguardado manda solo el delta, no todo cada vez.
function obtenerRespuestasModificadas(respuestasActuales, respuestasGuardadas) {
  const modificadas = {};

  for (const [idItem, respuesta] of Object.entries(respuestasActuales)) {
    const guardada = respuestasGuardadas[idItem];
    const cambioEstado = !guardada || guardada.estado !== respuesta.estado;
    const cambioPuntos = !guardada || guardada.puntos !== respuesta.puntos;

    if (cambioEstado || cambioPuntos) {
      modificadas[idItem] = respuesta;
    }
  }

  return modificadas;
}

// Guarda el delta de respuestas modificadas contra el backend y expone el
// estado de guardado (en curso / exitoso / pendiente de sincronizar). También
// reintenta automáticamente cuando vuelve la conexión.
export function useSincronizacionRespuestas({ idInspeccion, respuestas, respuestasGuardadas, setRespuestasGuardadas }) {
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [guardadoSinSincronizar, setGuardadoSinSincronizar] = useState(false);

  // Oculta el mensaje de guardado exitoso después de un tiempo (con cleanup,
  // para no actualizar el estado si el componente ya se desmontó).
  useEffect(() => {
    if (!guardadoExitoso) return;
    const id = setTimeout(() => setGuardadoExitoso(false), 2500);
    return () => clearTimeout(id);
  }, [guardadoExitoso]);

  const guardarDelta = useCallback(async () => {
    if (!idInspeccion) return true;

    const delta = obtenerRespuestasModificadas(respuestas, respuestasGuardadas);
    if (Object.keys(delta).length === 0) {
      setGuardadoSinSincronizar(false);
      return true;
    }

    setGuardando(true);

    try {
      await guardarRespuestas(idInspeccion, delta);
      setRespuestasGuardadas((actuales) => ({ ...actuales, ...delta }));
      setGuardadoSinSincronizar(false);
      setGuardadoExitoso(true);
      return true;
    } catch (error) {
      console.error('No se pudieron guardar las respuestas en el servidor:', error);
      setGuardadoExitoso(false);
      setGuardadoSinSincronizar(true);
      return false;
    } finally {
      setGuardando(false);
    }
  }, [idInspeccion, respuestas, respuestasGuardadas, setRespuestasGuardadas]);

  // Cuando vuelve la conexión, intenta sincronizar las respuestas que
  // quedaron guardadas únicamente de forma local.
  useEffect(() => {
    const sincronizarPendientes = () => {
      guardarDelta();
    };

    window.addEventListener('online', sincronizarPendientes);
    return () => window.removeEventListener('online', sincronizarPendientes);
  }, [guardarDelta]);

  // Limpia los indicadores de guardado (usado al salir/reiniciar la inspección).
  const reiniciarEstado = useCallback(() => {
    setGuardadoExitoso(false);
    setGuardadoSinSincronizar(false);
  }, []);

  return { guardando, guardadoExitoso, guardadoSinSincronizar, guardarDelta, reiniciarEstado };
}
