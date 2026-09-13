import { useMemo, useState } from 'react';
import {
  calcularResumenTotal,
  calcularPorcentajeCumplimiento,
  calcularPuntosExcluidosPorNoAplica,
  calcularPuntajeMaximoAjustado,
  clasificarPorcentaje,
  todasLasSeccionesCompletas,
  obtenerVistasIncompletas,
  obtenerCamposCierrePendientes,
  DATOS_CIERRE_INICIALES,
} from '../domain/cierreInspeccion';

// Encapsula el estado propio del formulario de cierre y los cálculos
// derivados: puntaje obtenido, máximo REALMENTE aplicable (excluyendo ítems
// N/A, corrige H5), porcentaje y clasificación.
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

  const puntosExcluidosPorNoAplica = useMemo(
    () => calcularPuntosExcluidosPorNoAplica(vistas, seccionesCache, respuestas),
    [vistas, seccionesCache, respuestas],
  );

  const puntajeMaximoAjustado = useMemo(
    () => calcularPuntajeMaximoAjustado(puntajeMaximoTipo, puntosExcluidosPorNoAplica),
    [puntajeMaximoTipo, puntosExcluidosPorNoAplica],
  );

  const porcentaje = useMemo(
    () => calcularPorcentajeCumplimiento(resumen.obtenidos, puntajeMaximoAjustado),
    [resumen.obtenidos, puntajeMaximoAjustado],
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
    puntosExcluidosPorNoAplica,
    puntajeMaximoAjustado,
    porcentaje,
    clasificacion,
    seccionesCompletas,
    vistasIncompletas,
    camposPendientes,
    puedeEnviar,
  };
}