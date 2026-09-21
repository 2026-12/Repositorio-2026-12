import { useCallback, useEffect, useState } from 'react';
import SeleccionEstablecimiento from './components/SeleccionEstablecimiento';
import FormularioSeccionB from './inspeccionAlimentos/components/FormularioSeccionB';
import FormularioSeccionC from './inspeccionAlimentos/components/FormularioSeccionC';
import FormularioSeccionAlimentos from './inspeccionAlimentos/components/FormularioSeccionAlimentos';
import FormularioCierreInspeccion from './inspeccionAlimentos/components/FormularioCierreInspeccion';
import { useWizardInspeccion } from './hooks/useWizardInspeccion';
import { cargarProgreso, guardarProgreso, limpiarProgreso } from './services/progresoInspeccionService';
import { eliminarInspeccion, guardarRespuestas } from './services/inspeccionesService';
import { TOTAL_PASOS_ALIMENTOS } from './inspeccionAlimentos/config/inspeccionAlimentos';
import { DATOS_CIERRE_INICIALES } from './domain/cierreInspeccion';
import { esVistaCompleta } from './domain/progresoVistas';

// Qué componente de formulario usar para cada vista (paso del asistente).
// La mayoría de las secciones (A, D, E, F, G, H) se pintan con el componente
// genérico FormularioSeccionAlimentos; solo B y C (que tienen subsecciones)
// tienen su propio componente.
const COMPONENTES_POR_CODIGO = {
  A: FormularioSeccionAlimentos,
  B: FormularioSeccionB,
  C: FormularioSeccionC,
  D: FormularioSeccionAlimentos,
  E: FormularioSeccionAlimentos,
  F: FormularioSeccionAlimentos,
  G: FormularioSeccionAlimentos,
  H: FormularioSeccionAlimentos,
};

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

// Acá vive toda la lógica del módulo: decide qué paso mostrar (selección,
// formulario, o cierre) y guarda el estado de la inspección en curso.
// App.jsx solo decide cuándo montar este módulo.
function InspeccionModulo({ onVolverInicio }) {
  // Al montar, intenta recuperar una inspección a medias desde localStorage.
  // Se lee una sola vez.
  const [progresoGuardado] = useState(cargarProgreso);

  const [datos, setDatos] = useState(progresoGuardado?.datos ?? null);
  const [respuestas, setRespuestas] = useState(progresoGuardado?.respuestas ?? {});
  const [respuestasGuardadas, setRespuestasGuardadas] = useState(progresoGuardado?.respuestasGuardadas ?? {});
  const [seccionesCache, setSeccionesCache] = useState(progresoGuardado?.seccionesCache ?? {});

  const wizard = useWizardInspeccion(
    datos?.secciones ?? [],
    progresoGuardado?.indiceWizard ?? 0,
    progresoGuardado?.maxAlcanzado ?? progresoGuardado?.indiceWizard ?? 0,
  );

  const [cierreActivo, setCierreActivo] = useState(progresoGuardado?.cierreActivo ?? false);
  const [datosCierre, setDatosCierre] = useState(progresoGuardado?.datosCierre ?? DATOS_CIERRE_INICIALES);

  const [errorGuardado, setErrorGuardado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [guardadoSinSincronizar, setGuardadoSinSincronizar] = useState(false);

  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);
  const [eliminandoInspeccion, setEliminandoInspeccion] = useState(false);
  const [errorSalida, setErrorSalida] = useState(null);

  // Chequea si TODAS las vistas están completas, incluyendo las compuestas
  // B (B1/B2/B3) y C (C1/C2).
  const todasLasSeccionesCompletas =
    wizard.vistas.length > 0 &&
    wizard.vistas.every((vista) =>
      esVistaCompleta(
        vista,
        seccionesCache,
        respuestas
      )
    );

  // Actualiza el mapa de respuestas de la sección actual.
  const actualizarRespuestas = useCallback((actualizar) => {
    setRespuestas((actuales) =>
      typeof actualizar === 'function'
        ? actualizar(actuales)
        : actualizar
    );
  }, []);

  // Actualiza los datos del formulario de cierre.
  const actualizarDatosCierre = useCallback((actualizar) => {
    setDatosCierre((actuales) =>
      typeof actualizar === 'function'
        ? actualizar(actuales)
        : actualizar
    );
  }, []);

  // Guarda en caché las secciones ya cargadas para no volver a pedirlas al backend.
  const registrarSeccion = useCallback((codigo, seccion) => {
    setSeccionesCache((actuales) =>
      actuales[codigo] === seccion
        ? actuales
        : {
            ...actuales,
            [codigo]: seccion,
          }
    );
  }, []);

  // Muestra el mensaje de guardado exitoso durante unos segundos.
  const mostrarGuardadoExitoso = useCallback(() => {
    setGuardadoSinSincronizar(false);
    setGuardadoExitoso(true);

    setTimeout(() => {
      setGuardadoExitoso(false);
    }, 2500);
  }, []);

  // Guarda las respuestas modificadas y después decide si continúa a otra
  // sección o si puede entrar a la pantalla de cierre.
  const avanzarYGuardar = useCallback(async () => {
    setErrorGuardado(null);
    setGuardando(true);

    if (datos?.idInspeccion) {
      const delta = obtenerRespuestasModificadas(
        respuestas,
        respuestasGuardadas
      );

      if (Object.keys(delta).length > 0) {
        try {
          await guardarRespuestas(
            datos.idInspeccion,
            delta
          );

          setRespuestasGuardadas((actuales) => ({
            ...actuales,
            ...delta,
          }));

          mostrarGuardadoExitoso();
        } catch (error) {
          console.error(
            'No se pudieron guardar las respuestas en el servidor:',
            error
          );

          setGuardadoExitoso(false);
          setGuardadoSinSincronizar(true);
        }
      }
    }

    setGuardando(false);

    // Si todavía existe una vista siguiente, continúa normalmente.
    if (wizard.puedeAvanzar) {
      wizard.avanzar();
      return;
    }

    // Llegar al final de las pestañas no significa que esté completa: antes
    // de abrir el cierre se valida todo.
    if (!todasLasSeccionesCompletas) {
      setErrorGuardado(
        'Debe completar todas las secciones de la inspección antes de continuar al cierre.'
      );

      return;
    }

    // El cierre solo se habilita cuando todas las secciones están completas.
    setCierreActivo(true);
  }, [
    datos?.idInspeccion,
    respuestas,
    respuestasGuardadas,
    wizard,
    mostrarGuardadoExitoso,
    todasLasSeccionesCompletas,
  ]);

  // Regresa de la pantalla de cierre al formulario.
  const volverDeCierre = useCallback(() => {
    setCierreActivo(false);
  }, []);

  // Guarda el progreso completo en localStorage.
  useEffect(() => {
    if (!datos) {
      limpiarProgreso();
      return;
    }

    guardarProgreso({
      datos,
      respuestas,
      respuestasGuardadas,
      seccionesCache,
      indiceWizard: wizard.indice,
      maxAlcanzado: wizard.maxAlcanzado,
      cierreActivo,
      datosCierre,
    });
  }, [
    datos,
    respuestas,
    respuestasGuardadas,
    seccionesCache,
    wizard.indice,
    wizard.maxAlcanzado,
    cierreActivo,
    datosCierre,
  ]);

  // Cuando vuelve la conexión, intenta sincronizar las respuestas que
  // quedaron guardadas únicamente de forma local.
  useEffect(() => {
    const sincronizarPendientes = async () => {
      if (!datos?.idInspeccion) {
        return;
      }

      const delta = obtenerRespuestasModificadas(
        respuestas,
        respuestasGuardadas
      );

      if (Object.keys(delta).length === 0) {
        setGuardadoSinSincronizar(false);
        return;
      }

      setGuardando(true);

      try {
        await guardarRespuestas(
          datos.idInspeccion,
          delta
        );

        setRespuestasGuardadas((actuales) => ({
          ...actuales,
          ...delta,
        }));

        setErrorGuardado(null);
        mostrarGuardadoExitoso();
      } catch (error) {
        console.error(
          'No se pudieron sincronizar las respuestas pendientes:',
          error
        );

        setGuardadoExitoso(false);
        setGuardadoSinSincronizar(true);
      } finally {
        setGuardando(false);
      }
    };

    window.addEventListener(
      'online',
      sincronizarPendientes
    );

    return () => {
      window.removeEventListener(
        'online',
        sincronizarPendientes
      );
    };
  }, [
    datos?.idInspeccion,
    respuestas,
    respuestasGuardadas,
    mostrarGuardadoExitoso,
  ]);

  // Sube el scroll hasta arriba cada vez que cambia la vista o se abre el cierre.
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [
    wizard.indice,
    cierreActivo,
  ]);

  // Abre el modal para volver al menú principal.
  const volverAlInicio = useCallback(() => {
    setErrorSalida(null);
    setMostrarConfirmacionSalida(true);
  }, []);

  // Cierra el modal de confirmación.
  const cancelarVolverAlInicio = useCallback(() => {
    if (eliminandoInspeccion) return;

    setErrorSalida(null);
    setMostrarConfirmacionSalida(false);
  }, [eliminandoInspeccion]);

  // Sale de la inspección sin conservarla.
  const salirSinGuardar = useCallback(async () => {
    setErrorSalida(null);
    setEliminandoInspeccion(true);

    if (datos?.idInspeccion) {
      try {
        await eliminarInspeccion(
          datos.idInspeccion
        );
      } catch (error) {
        setErrorSalida(
          `No se pudo salir de la inspección: ${error.message}`
        );

        setEliminandoInspeccion(false);
        return;
      }
    }

    setDatos(null);
    setRespuestas({});
    setRespuestasGuardadas({});
    setSeccionesCache({});
    setCierreActivo(false);
    setDatosCierre(DATOS_CIERRE_INICIALES);
    setErrorGuardado(null);
    setGuardadoExitoso(false);
    setGuardadoSinSincronizar(false);

    setMostrarConfirmacionSalida(false);
    setEliminandoInspeccion(false);

    wizard.reiniciar();

    limpiarProgreso();

    onVolverInicio();
  }, [
    datos?.idInspeccion,
    wizard,
    onVolverInicio,
  ]);

  // Regresa a la selección de establecimiento y descarta la inspección actual.
  const volverASeleccionEstablecimiento = useCallback(async () => {
    if (datos?.idInspeccion) {
      try {
        await eliminarInspeccion(
          datos.idInspeccion
        );
      } catch (error) {
        setErrorGuardado(
          error.message ||
            'No se pudo regresar a la selección del establecimiento.'
        );

        return;
      }
    }

    setDatos(null);
    setRespuestas({});
    setRespuestasGuardadas({});
    setSeccionesCache({});
    setCierreActivo(false);
    setDatosCierre(DATOS_CIERRE_INICIALES);
    setErrorGuardado(null);
    setGuardadoExitoso(false);
    setGuardadoSinSincronizar(false);

    wizard.reiniciar();

    limpiarProgreso();
  }, [
    datos?.idInspeccion,
    wizard,
  ]);

  // Limpia el estado cuando una inspección fue finalizada correctamente.
  const manejarInspeccionFinalizada = useCallback(() => {
    setDatos(null);
    setRespuestas({});
    setRespuestasGuardadas({});
    setSeccionesCache({});
    setCierreActivo(false);
    setDatosCierre(DATOS_CIERRE_INICIALES);
    setErrorGuardado(null);
    setGuardadoExitoso(false);
    setGuardadoSinSincronizar(false);

    wizard.reiniciar();

    limpiarProgreso();

    onVolverInicio();
  }, [wizard, onVolverInicio]);

  // Permite cerrar el modal de salida con Escape.
  useEffect(() => {
    const manejarEscape = (event) => {
      if (
        event.key === 'Escape' &&
        mostrarConfirmacionSalida
      ) {
        cancelarVolverAlInicio();
      }
    };

    document.addEventListener(
      'keydown',
      manejarEscape
    );

    return () => {
      document.removeEventListener(
        'keydown',
        manejarEscape
      );
    };
  }, [
    mostrarConfirmacionSalida,
    cancelarVolverAlInicio,
  ]);

  // ---- A partir de aquí se decide qué paso del módulo mostrar ----

  // Todavía no se eligió un establecimiento.
  if (!datos) {
    return (
      <SeleccionEstablecimiento
        onComenzar={setDatos}
        onVolverInicio={onVolverInicio}
      />
    );
  }

  // Mensajes y modales globales.
  const mensajesGlobales = (
    <>
      {guardando && (
        <div
          className="estado-guardado estado-guardado--guardando"
          role="status"
          aria-live="polite"
        >
          <span className="estado-guardado__spinner"></span>

          <span>
            Guardando...
          </span>
        </div>
      )}

      {!guardando && guardadoExitoso && (
        <div
          className="estado-guardado estado-guardado--sincronizado"
          role="status"
          aria-live="polite"
        >
          <span className="estado-guardado__icono estado-guardado__icono--exito">
            ✓
          </span>

          <span>
            Guardado correctamente
          </span>
        </div>
      )}

      {!guardando && guardadoSinSincronizar && (
        <div
          className="estado-guardado estado-guardado--local"
          role="status"
          aria-live="polite"
        >
          <span className="estado-guardado__icono estado-guardado__icono--local">
            !
          </span>

          <span>
            Guardado sin sincronizar
          </span>
        </div>
      )}

      {errorGuardado && (
        <div
          className="notificacion-global notificacion-global--error"
          role="alert"
        >
          <div>
            <strong>
              No se puede continuar
            </strong>

            <span>
              {errorGuardado}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setErrorGuardado(null)
            }
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      {mostrarConfirmacionSalida && (
        <div className="modal-overlay">
          <div
            className="modal-confirmacion"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacion-salida"
          >
            <h2 id="titulo-confirmacion-salida">
              ¿Volver al menú principal?
            </h2>

            <p>
              Si sale de la inspección sin guardar,
              se perderá el progreso registrado.
            </p>

            {errorSalida && (
              <div
                className="modal-error"
                role="alert"
              >
                <strong>
                  No se pudo completar la acción
                </strong>

                <span>
                  {errorSalida}
                </span>
              </div>
            )}

            <div className="modal-confirmacion__acciones">
              <button
                type="button"
                className="boton-modal boton-modal--secundario"
                onClick={cancelarVolverAlInicio}
                disabled={eliminandoInspeccion}
              >
                Cancelar
              </button>

              {/* Botón deshabilitado a propósito: la función "Guardar borrador" aún no está implementada. */}
              <button
                type="button"
                className="boton-modal boton-modal--secundario"
                disabled
                title="Esta funcionalidad estará disponible próximamente"
              >
                Guardar borrador
              </button>

              <button
                type="button"
                className="boton-modal boton-modal--primario"
                onClick={salirSinGuardar}
                disabled={eliminandoInspeccion}
              >
                {eliminandoInspeccion
                  ? 'Saliendo…'
                  : 'Salir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // El cierre solo se puede mostrar cuando ya se completaron todas las secciones.
  if (cierreActivo) {
    return (
      <>
        {mensajesGlobales}

        <FormularioCierreInspeccion
          datos={datos}
          vistas={wizard.vistas}
          seccionesCache={seccionesCache}
          respuestas={respuestas}
          datosCierre={datosCierre}
          onDatosCierreChange={actualizarDatosCierre}
          onAnterior={volverDeCierre}
          onFinalizado={manejarInspeccionFinalizada}
          paso={TOTAL_PASOS_ALIMENTOS}
          totalPasos={TOTAL_PASOS_ALIMENTOS}
        />
      </>
    );
  }

  // Elige el componente de formulario según la vista actual.
  const Formulario =
    COMPONENTES_POR_CODIGO[
      wizard.vistaActual?.codigo
    ] ?? FormularioSeccionAlimentos;

  // En la primera vista, Anterior vuelve a la selección del establecimiento.
  // En las demás, retrocede dentro de las vistas de la inspección.
  const manejarAnterior =
    wizard.indice === 0
      ? volverASeleccionEstablecimiento
      : wizard.retroceder;

  // Secciones simples que reutilizan FormularioSeccionAlimentos.
  if (
    Formulario === FormularioSeccionAlimentos
  ) {
    return (
      <>
        {mensajesGlobales}

        <Formulario
          datos={datos}
          codigo={wizard.vistaActual?.codigo}
          titulo={
            wizard.vistaActual?.secciones[0]
              ?.nombre ??
            'Sección de inspección'
          }
          paso={wizard.indice + 1}
          totalPasos={wizard.vistas.length}
          tabActivo={wizard.indice}
          onAnterior={manejarAnterior}
          onSiguiente={avanzarYGuardar}
          onVolverInicio={volverAlInicio}
          puedeRetroceder
          respuestas={respuestas}
          onRespuestasChange={actualizarRespuestas}
          seccionInicial={
            seccionesCache[
              wizard.vistaActual?.codigo
            ]
          }
          seccionesCache={seccionesCache}
          onSeccionCargada={registrarSeccion}
          onIrAVista={wizard.irAVista}
          maxAlcanzado={wizard.maxAlcanzado}
          indiceActual={wizard.indice}
          vistas={wizard.vistas}
          marcarVistaCompleta={wizard.marcarVistaCompleta}
          guardando={guardando}
        />
      </>
    );
  }

  // Componentes dedicados B y C.
  return (
    <>
      {mensajesGlobales}

      <Formulario
        datos={datos}
        onAnterior={manejarAnterior}
        onSiguiente={avanzarYGuardar}
        onVolverInicio={volverAlInicio}
        puedeRetroceder
        puedeAvanzar={wizard.puedeAvanzar}
        respuestas={respuestas}
        onRespuestasChange={actualizarRespuestas}
        paso={wizard.indice + 1}
        totalPasos={wizard.vistas.length}
        seccionesCache={seccionesCache}
        onSeccionCargada={registrarSeccion}
        onIrAVista={wizard.irAVista}
        maxAlcanzado={wizard.maxAlcanzado}
        indiceActual={wizard.indice}
        vistas={wizard.vistas}
        marcarVistaCompleta={wizard.marcarVistaCompleta}
        guardando={guardando}
      />
    </>
  );
}

export default InspeccionModulo;
