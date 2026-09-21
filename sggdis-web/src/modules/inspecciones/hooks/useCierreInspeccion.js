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

// Estado del formulario de cierre más los cálculos derivados: puntaje,
// máximo real (sin los ítems en N/A, corrige H5), porcentaje y clasificación.
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

  // Actualiza un campo del formulario (controlado o local, igual que en useRespuestasInspeccion).
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

  // Solo se puede enviar si las secciones están completas y no falta ningún campo.
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