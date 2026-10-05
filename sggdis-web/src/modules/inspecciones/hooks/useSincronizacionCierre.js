import { useCallback, useEffect, useRef, useState } from 'react';
import { cerrarInspeccion, guardarRespuestas } from '../services/inspeccionesService';
import {
  eliminarCierrePendiente,
  encolarCierrePendiente,
  obtenerCierrePendiente,
} from '../services/colaSincronizacionService';

function esErrorDeRed(error) {
  return error instanceof TypeError || globalThis.navigator?.onLine === false;
}

export function useSincronizacionCierre({ idInspeccion, onFinalizado }) {
  const [pendienteSincronizacion, setPendienteSincronizacion] = useState(false);
  const [errorSincronizacion, setErrorSincronizacion] = useState(null);
  const procesando = useRef(false);

  const sincronizarRegistro = useCallback(async (registro) => {
    if (procesando.current) return false;
    procesando.current = true;
    setErrorSincronizacion(null);
    try {
      await guardarRespuestas(registro.idInspeccion, registro.respuestas);
      const confirmacion = await cerrarInspeccion(registro.idInspeccion, registro.datosCierre);
      eliminarCierrePendiente(registro.idInspeccion);
      setPendienteSincronizacion(false);
      onFinalizado(confirmacion);
      return true;
    } catch (error) {
      if (esErrorDeRed(error)) {
        setPendienteSincronizacion(true);
      } else {
        setErrorSincronizacion(error.message || 'No se pudo sincronizar la inspección.');
      }
      return false;
    } finally {
      procesando.current = false;
    }
  }, [onFinalizado]);

  const finalizar = useCallback(async ({ datosCierre, respuestas, guardarDelta }) => {
    setErrorSincronizacion(null);
    try {
      const resultadoDelta = await guardarDelta();
      if (resultadoDelta !== true) {
        const error = resultadoDelta instanceof Error
          ? resultadoDelta
          : new Error('No se pudieron sincronizar las respuestas antes de finalizar.');
        if (!esErrorDeRed(error)) throw error;
        encolarCierrePendiente({ idInspeccion, datosCierre, respuestas });
        setPendienteSincronizacion(true);
        return { pendiente: true };
      }

      const confirmacion = await cerrarInspeccion(idInspeccion, datosCierre);
      onFinalizado(confirmacion);
      return { pendiente: false, confirmacion };
    } catch (error) {
      if (!esErrorDeRed(error)) {
        setErrorSincronizacion(error.message || 'No se pudo finalizar la inspección.');
        throw error;
      }

      try {
        encolarCierrePendiente({ idInspeccion, datosCierre, respuestas });
        setPendienteSincronizacion(true);
        return { pendiente: true };
      } catch (errorCola) {
        setErrorSincronizacion(`No se pudo guardar el envío pendiente en este dispositivo: ${errorCola.message}`);
        throw errorCola;
      }
    }
  }, [idInspeccion, onFinalizado]);

  useEffect(() => {
    if (!idInspeccion) return undefined;
    const reintentar = () => {
      let registro;
      try {
        registro = obtenerCierrePendiente(idInspeccion);
      } catch (error) {
        setErrorSincronizacion(`No se pudo leer la cola de sincronización: ${error.message}`);
        return;
      }
      if (registro) {
        setPendienteSincronizacion(true);
        if (globalThis.navigator?.onLine !== false) sincronizarRegistro(registro);
      }
    };

    reintentar();
    window.addEventListener('online', reintentar);
    return () => window.removeEventListener('online', reintentar);
  }, [idInspeccion, sincronizarRegistro]);

  return { finalizar, pendienteSincronizacion, errorSincronizacion };
}
