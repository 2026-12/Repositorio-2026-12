import { useCallback, useEffect, useState } from 'react';
import PantallaInicio from './components/PantallaInicio';
import SeleccionEstablecimiento from './components/SeleccionEstablecimiento';
import FormularioSeccionB from './components/FormularioSeccionB';
import FormularioSeccionC from './components/FormularioSeccionC';
import FormularioSeccionAlimentos from './components/FormularioSeccionAlimentos';
import FormularioSeccionH from './components/FormularioSeccionH';
import FormularioCierreInspeccion from './components/FormularioCierreInspeccion';
import { useWizardInspeccion } from './hooks/useWizardInspeccion';
import { cargarProgreso, guardarProgreso, limpiarProgreso } from './services/progresoInspeccionService';
import { eliminarInspeccion, guardarRespuestas } from './services/inspeccionesService';
import { TOTAL_PASOS_ALIMENTOS } from './config/inspeccionAlimentos';
import { DATOS_CIERRE_INICIALES } from './domain/cierreInspeccion';

const COMPONENTES_POR_CODIGO = {
  A: FormularioSeccionAlimentos,
  B: FormularioSeccionB,
  C: FormularioSeccionC,
  D: FormularioSeccionAlimentos,
  E: FormularioSeccionAlimentos,
  F: FormularioSeccionAlimentos,
  G: FormularioSeccionAlimentos,
  H: FormularioSeccionH,
};

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

function App() {
  const [progresoGuardado] = useState(cargarProgreso);

  const [pantallaActual, setPantallaActual] = useState(() => {
    if (progresoGuardado?.datos) {
      return 'inspeccion';
    }

    return sessionStorage.getItem('pantallaActualSGGDIS') ?? 'inicio';
  });

  const [datos, setDatos] = useState(progresoGuardado?.datos ?? null);
  const [respuestas, setRespuestas] = useState(progresoGuardado?.respuestas ?? {});
  const [respuestasGuardadas, setRespuestasGuardadas] = useState(progresoGuardado?.respuestasGuardadas ?? {});
  const [seccionesCache, setSeccionesCache] = useState(progresoGuardado?.seccionesCache ?? {});

  const wizard = useWizardInspeccion(
    datos?.secciones ?? [],
    progresoGuardado?.indiceWizard ?? 0,
    progresoGuardado?.maxAlcanzado ?? progresoGuardado?.indiceWizard ?? 0,
  );

  const [observaciones, setObservaciones] = useState(progresoGuardado?.observaciones ?? {});
  const [cierreActivo, setCierreActivo] = useState(progresoGuardado?.cierreActivo ?? false);
  const [datosCierre, setDatosCierre] = useState(progresoGuardado?.datosCierre ?? DATOS_CIERRE_INICIALES);

  const [errorGuardado, setErrorGuardado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] = useState(false);
  const [eliminandoInspeccion, setEliminandoInspeccion] = useState(false);
  const [errorSalida, setErrorSalida] = useState(null);

  useEffect(() => {
    sessionStorage.setItem('pantallaActualSGGDIS', pantallaActual);
  }, [pantallaActual]);

  const actualizarObservaciones = useCallback((actualizar) => {
    setObservaciones((actuales) =>
      typeof actualizar === 'function'
        ? actualizar(actuales)
        : actualizar
    );
  }, []);

  const actualizarRespuestas = useCallback((actualizar) => {
    setRespuestas((actuales) =>
      typeof actualizar === 'function'
        ? actualizar(actuales)
        : actualizar
    );
  }, []);

  const actualizarDatosCierre = useCallback((actualizar) => {
    setDatosCierre((actuales) =>
      typeof actualizar === 'function'
        ? actualizar(actuales)
        : actualizar
    );
  }, []);

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

  const mostrarGuardadoExitoso = useCallback(() => {
    setGuardadoExitoso(true);

    setTimeout(() => {
      setGuardadoExitoso(false);
    }, 2500);
  }, []);

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
          await guardarRespuestas(datos.idInspeccion, delta);

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

          setErrorGuardado(
            error.message ||
              'No se pudieron guardar las respuestas en el servidor. Verifique la conexión e intente nuevamente.'
          );

          setGuardando(false);
          return;
        }
      }
    }

    setGuardando(false);

    if (wizard.puedeAvanzar) {
      wizard.avanzar();
    } else {
      setCierreActivo(true);
    }
  }, [
    datos?.idInspeccion,
    respuestas,
    respuestasGuardadas,
    wizard,
    mostrarGuardadoExitoso,
  ]);

  const volverDeCierre = useCallback(() => {
    setCierreActivo(false);
  }, []);

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
      observaciones,
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
    observaciones,
    wizard.indice,
    wizard.maxAlcanzado,
    cierreActivo,
    datosCierre,
  ]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [wizard.indice, cierreActivo]);

  const volverAlInicio = useCallback(() => {
    setErrorSalida(null);
    setMostrarConfirmacionSalida(true);
  }, []);

  const cancelarVolverAlInicio = useCallback(() => {
    if (eliminandoInspeccion) return;

    setErrorSalida(null);
    setMostrarConfirmacionSalida(false);
  }, [eliminandoInspeccion]);

  const salirSinGuardar = useCallback(async () => {
    setErrorSalida(null);
    setEliminandoInspeccion(true);

    if (datos?.idInspeccion) {
      try {
        await eliminarInspeccion(datos.idInspeccion);
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
    setObservaciones({});
    setCierreActivo(false);
    setDatosCierre(DATOS_CIERRE_INICIALES);
    setErrorGuardado(null);

    setMostrarConfirmacionSalida(false);
    setEliminandoInspeccion(false);

    wizard.reiniciar();

    limpiarProgreso();

    setPantallaActual('inicio');
  }, [datos?.idInspeccion, wizard]);

  const volverASeleccionEstablecimiento = useCallback(async () => {
    if (datos?.idInspeccion) {
      try {
        await eliminarInspeccion(datos.idInspeccion);
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
    setObservaciones({});
    setCierreActivo(false);
    setDatosCierre(DATOS_CIERRE_INICIALES);
    setErrorGuardado(null);

    wizard.reiniciar();

    limpiarProgreso();

    setPantallaActual('inspeccion');
  }, [datos?.idInspeccion, wizard]);

  const manejarInspeccionFinalizada = useCallback(() => {
    setDatos(null);
    setRespuestas({});
    setRespuestasGuardadas({});
    setSeccionesCache({});
    setObservaciones({});
    setCierreActivo(false);
    setDatosCierre(DATOS_CIERRE_INICIALES);
    setErrorGuardado(null);

    wizard.reiniciar();

    limpiarProgreso();

    setPantallaActual('inicio');
  }, [wizard]);

  useEffect(() => {
    const manejarEscape = (event) => {
      if (
        event.key === 'Escape' &&
        mostrarConfirmacionSalida
      ) {
        cancelarVolverAlInicio();
      }
    };

    document.addEventListener('keydown', manejarEscape);

    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [
    mostrarConfirmacionSalida,
    cancelarVolverAlInicio,
  ]);

  if (pantallaActual === 'inicio') {
    return (
      <PantallaInicio
        onNuevaInspeccion={() =>
          setPantallaActual('inspeccion')
        }
        onHistorial={() => {
          console.log(
            'Historial pendiente de implementar'
          );
        }}
        onReportes={() => {
          console.log(
            'Reportes pendiente de implementar'
          );
        }}
        onCerrarSesion={() => {
          console.log(
            'Cerrar sesión pendiente de conectar'
          );
        }}
      />
    );
  }

  if (!datos) {
    return (
      <SeleccionEstablecimiento
        onComenzar={setDatos}
        onVolverInicio={() =>
          setPantallaActual('inicio')
        }
      />
    );
  }

  const mensajesGlobales = (
    <>
      {guardadoExitoso && (
        <div
          className="notificacion-global notificacion-global--exito"
          role="status"
        >
          <strong>
            Cambios guardados correctamente
          </strong>
        </div>
      )}

      {errorGuardado && (
        <div
          className="notificacion-global notificacion-global--error"
          role="alert"
        >
          <div>
            <strong>
              No se pudieron guardar las respuestas
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

  const Formulario =
    COMPONENTES_POR_CODIGO[
      wizard.vistaActual?.codigo
    ] ?? FormularioSeccionAlimentos;

  const manejarAnterior =
    wizard.indice === 0
      ? volverASeleccionEstablecimiento
      : wizard.retroceder;

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
          guardando={guardando}
        />
      </>
    );
  }

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
        observaciones={observaciones}
        onObservacionesChange={
          actualizarObservaciones
        }
        paso={wizard.indice + 1}
        totalPasos={wizard.vistas.length}
        seccionesCache={seccionesCache}
        onSeccionCargada={registrarSeccion}
        onIrAVista={wizard.irAVista}
        maxAlcanzado={wizard.maxAlcanzado}
        indiceActual={wizard.indice}
        vistas={wizard.vistas}
        guardando={guardando}
      />
    </>
  );
}

export default App;