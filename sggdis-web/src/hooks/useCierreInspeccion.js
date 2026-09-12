import { useMemo, useState } from 'react';
import {
  calcularResumenTotal,
  calcularPorcentajeCumplimiento,
  clasificarPorcentaje,
  todasLasSeccionesCompletas,
  obtenerVistasIncompletas,
  obtenerCamposCierrePendientes,
  DATOS_CIERRE_INICIALES,
} from '../domain/cierreInspeccion';

// Encapsula el estado propio del formulario de cierre (datos de inspector y
// representante, observaciones y orden sanitaria) y los cálculos derivados
// (puntaje total, porcentaje, clasificación) que dependen de lo respondido
// en el resto de la inspección. Sigue el mismo patrón controlado/no controlado
// que useRespuestasInspeccion: si App.jsx pasa datosCierre/onDatosCierreChange,
// el estado se guarda ahí (y por lo tanto en localStorage); si no, es local.
export function useCierreInspeccion({
  vistas,
  seccionesCache,
  respuestas,
  puntajeMaximoTipo,
  datosCierre: datosCierreControlado,
  onDatosCierreChange,
}) {
  const [datosCierreLocales, setDatosCierreLocales] = useState(DATOS_CIERRE_INICIALES);
  const datosCierre = datosCierreControlado ?? datosCierreLocales;

  const actualizarCampo = (campo, valor) => {
    if (onDatosCierreChange) {
      onDatosCierreChange((actuales) => ({ ...(actuales ?? DATOS_CIERRE_INICIALES), [campo]: valor }));
    } else {
      setDatosCierreLocales((actuales) => ({ ...actuales, [campo]: valor }));
    }
  };

  const resumen = useMemo(
    () => calcularResumenTotal(vistas, seccionesCache, respuestas),
    [vistas, seccionesCache, respuestas],
  );

  const porcentaje = useMemo(
    () => calcularPorcentajeCumplimiento(resumen.obtenidos, puntajeMaximoTipo),
    [resumen.obtenidos, puntajeMaximoTipo],
  );

  const clasificacion = useMemo(() => clasificarPorcentaje(porcentaje), [porcentaje]);

  const seccionesCompletas = useMemo(
    () => todasLasSeccionesCompletas(vistas, seccionesCache, respuestas),
    [vistas, seccionesCache, respuestas],
  );

  const vistasIncompletas = useMemo(
    () => obtenerVistasIncompletas(vistas, seccionesCache, respuestas),
    [vistas, seccionesCache, respuestas],
  );

  const camposPendientes = useMemo(
    () => obtenerCamposCierrePendientes(datosCierre),
    [datosCierre],
  );

  const puedeEnviar = seccionesCompletas && camposPendientes.length === 0;

  return {
    datosCierre,
    actualizarCampo,
    resumen,
    porcentaje,
    clasificacion,
    seccionesCompletas,
    vistasIncompletas,
    camposPendientes,
    puedeEnviar,
  };
}