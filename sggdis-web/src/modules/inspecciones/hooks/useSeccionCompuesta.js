import { useEffect, useMemo, useState } from 'react';
import { obtenerSeccion } from '../services/guiasInspeccionService';
import { agruparPorArticulo } from '../domain/agrupacionItems';
import { obtenerPendientes } from '../domain/validacionSeccion';
import { useRespuestasInspeccion } from './useRespuestasInspeccion';

// Encapsula la lógica común a las secciones compuestas (B: B1/B2/B3, C: C1/C2):
// carga en paralelo de subsecciones, navegación entre ellas y cálculo de progreso.
export function useSeccionCompuesta({
  subseccionesDisponibles,
  datos,
  seccionesCache = {},
  onSeccionCargada,
  respuestas = {},
  onRespuestasChange,
  marcarVistaCompleta,
  indiceActual = 0,
  onIrAVista,
  onAnterior,
  onSiguiente,
}) {
  // Solo se muestran las subsecciones que en verdad le aplican al tipo de establecimiento.
  const subsecciones = useMemo(
    () => subseccionesDisponibles.filter((sub) => datos.secciones?.some((seccion) => seccion.codigo === sub.codigo)),
    [datos.secciones, subseccionesDisponibles],
  );

  const [subSeccionActiva, setSubSeccionActiva] = useState(subsecciones[0]?.codigo ?? subseccionesDisponibles[0].codigo);
  const [gruposPorSubseccion, setGruposPorSubseccion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarPendientes, setMostrarPendientes] = useState(false);
  const [mensajeNavegacion, setMensajeNavegacion] = useState('');

  // Al cambiar de subsección llevar la vista al inicio de la página.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [subSeccionActiva]);

  // Carga todas las subsecciones en paralelo, reusando la caché si ya existía.
  useEffect(() => {
    async function cargarSubsecciones() {
      try {
        setCargando(true);
        setError(null);

        const resultados = await Promise.all(
          subsecciones.map((sub) => seccionesCache[sub.codigo] ?? obtenerSeccion(datos.idGuia ?? 1, sub.codigo, datos.idTipoEstablecimiento)),
        );

        const nuevosGrupos = {};
        resultados.forEach((datosApi, i) => {
          nuevosGrupos[subsecciones[i].codigo] = agruparPorArticulo(datosApi.items);
          onSeccionCargada?.(subsecciones[i].codigo, datosApi);
        });

        setGruposPorSubseccion(nuevosGrupos);
      } catch (err) {
        console.error('Error al cargar la sección:', err);
        setError('No se pudo cargar la sección. Verifique que el backend esté disponible.');
      } finally {
        setCargando(false);
      }
    }

    cargarSubsecciones();
  }, [datos.idGuia, datos.idTipoEstablecimiento, onSeccionCargada, seccionesCache, subsecciones]);

  const grupos = useMemo(() => gruposPorSubseccion[subSeccionActiva] ?? [], [gruposPorSubseccion, subSeccionActiva]);

  const { alternarRespuesta, actualizarPuntos, resumen } = useRespuestasInspeccion(grupos, respuestas, onRespuestasChange);
  const { obtenidos, maximo, criticosIncumplidos } = resumen;

  const itemsPendientesDetalle = useMemo(() => obtenerPendientes(grupos, respuestas), [grupos, respuestas]);
  const itemsSinResponder = itemsPendientesDetalle.length;

  const tieneRespuestasSubseccion = grupos.some((grupo) => grupo.items.some((item) => Boolean(respuestas[item.id]?.estado)));
  const subseccionIncompletaIniciada = tieneRespuestasSubseccion && itemsSinResponder > 0;

  const subseccionesCompletas = useMemo(() => {
    const completas = {};

    subsecciones.forEach((sub) => {
      const gruposSubseccion = gruposPorSubseccion[sub.codigo] ?? [];
      const totalItems = gruposSubseccion.reduce((total, grupo) => total + grupo.items.length, 0);
      completas[sub.codigo] = totalItems > 0 && obtenerPendientes(gruposSubseccion, respuestas).length === 0;
    });

    return completas;
  }, [gruposPorSubseccion, respuestas, subsecciones]);

  // Avisa al asistente si la vista compuesta ya está completa. Sin esto, "Siguiente" en la
  // última subsección nunca avanza de verdad y salta directo al cierre.
  useEffect(() => {
    if (!marcarVistaCompleta || subsecciones.length === 0) return;

    const todasCargadas = subsecciones.every((sub) => (gruposPorSubseccion[sub.codigo]?.length ?? 0) > 0);
    if (!todasCargadas) return;

    const tieneRespuestas = subsecciones.some((sub) =>
      (gruposPorSubseccion[sub.codigo] ?? []).some((grupo) => grupo.items.some((item) => respuestas[item.id]?.estado)),
    );

    const todasCompletas = subsecciones.every((sub) => subseccionesCompletas[sub.codigo]);

    marcarVistaCompleta(todasCompletas, !tieneRespuestas);
  }, [subsecciones, gruposPorSubseccion, respuestas, subseccionesCompletas, marcarVistaCompleta]);

  const mostrarAvisoPendientes = () => {
    setMostrarPendientes(true);
    setMensajeNavegacion('Complete la subsección actual antes de continuar.');

    requestAnimationFrame(() => {
      const primerPendiente = document.querySelector('.item--pendiente');
      if (primerPendiente) {
        primerPendiente.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => primerPendiente.focus(), 450);
      }
    });

    setTimeout(() => setMensajeNavegacion(''), 3500);
  };

  const manejarCambioSubseccion = (codigoDestino) => {
    if (codigoDestino === subSeccionActiva) return;
    if (subseccionIncompletaIniciada) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');
    setSubSeccionActiva(codigoDestino);
  };

  const manejarIrAVista = (indiceDestino) => {
    if (indiceDestino === indiceActual) return;
    if (subseccionIncompletaIniciada) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');
    onIrAVista?.(indiceDestino);
  };

  // "Anterior" dentro de la sección compuesta: retrocede a la subsección previa antes
  // de retroceder a la vista anterior del asistente (eso lo maneja onAnterior).
  const manejarAnterior = () => {
    if (subseccionIncompletaIniciada) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');

    const index = subsecciones.findIndex((sub) => sub.codigo === subSeccionActiva);
    if (index > 0) {
      setSubSeccionActiva(subsecciones[index - 1].codigo);
    } else {
      onAnterior?.();
    }
  };

  // "Siguiente": avanza entre subsecciones y solo llama a onSiguiente en la última.
  const manejarSiguiente = () => {
    if (itemsSinResponder > 0) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');

    const index = subsecciones.findIndex((sub) => sub.codigo === subSeccionActiva);
    if (index < subsecciones.length - 1) {
      setSubSeccionActiva(subsecciones[index + 1].codigo);
    } else {
      onSiguiente?.();
    }
  };

  const subSeccionInfo = subsecciones.find((sub) => sub.codigo === subSeccionActiva) ?? subseccionesDisponibles[0];

  return {
    subsecciones,
    subSeccionActiva,
    subSeccionInfo,
    grupos,
    cargando,
    error,
    mostrarPendientes,
    mensajeNavegacion,
    alternarRespuesta,
    actualizarPuntos,
    obtenidos,
    maximo,
    criticosIncumplidos,
    subseccionesCompletas,
    manejarCambioSubseccion,
    manejarIrAVista,
    manejarAnterior,
    manejarSiguiente,
  };
}
