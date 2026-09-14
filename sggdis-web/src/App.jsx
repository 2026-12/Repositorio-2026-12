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

// Qué componente de formulario usar para cada vista (paso del asistente).
// La mayoría de las secciones (A, D, E, F, G) se pintan con el componente
// genérico FormularioSeccionAlimentos; B, C y H tienen su propio componente
// porque necesitan algo especial en su formulario.
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

// Compara las respuestas actuales contra las que ya se guardaron en el
// backend y devuelve solo las que cambiaron. Así el autoguardado solo manda
// al servidor lo que realmente cambió, no todas las respuestas cada vez.
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

// Componente raíz de la aplicación: decide qué pantalla mostrar (inicio,
// selección de establecimiento, formulario de una sección, o cierre) y
// mantiene todo el estado de la inspección en curso, incluyendo el
// autoguardado tanto en el navegador (localStorage) como en el backend.
function App() {
  // Al montar la app, intenta recuperar una inspección que haya quedado a
  // medias (guardada en localStorage). Se lee una sola vez (useState con función).
  const [progresoGuardado] = useState(cargarProgreso);

  // Si hay una inspección guardada, se retoma directo ahí; si no, se recuerda
  // en qué pantalla estaba el usuario (guardado en sessionStorage) o se
  // empieza desde el inicio.
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

  // Recuerda en qué pantalla está el usuario, para poder restaurarla si recarga la página.
  useEffect(() => {
    sessionStorage.setItem('pantallaActualSGGDIS', pantallaActual);
  }, [pantallaActual]);

  // Actualiza las observaciones libres que se pueden escribir en algunas secciones.
  const actualizarObservaciones = useCallback((actualizar) => {
    setObservaciones((actuales) =>
      typeof actualizar === 'function'
        ? actualizar(actuales)
        : actualizar
    );
  }, []);

  // Actualiza el mapa de respuestas de la sección actual (estado controlado, pasado a los formularios).
  const actualizarRespuestas = useCallback((actualizar) => {
    setRespuestas((actuales) =>
      typeof actualizar === 'function'
        ? actualizar(actuales)
        : actualizar
    );
  }, []);

  // Actualiza los datos del formulario de cierre (inspector, representante, etc.).
  const actualizarDatosCierre = useCallback((actualizar) => {
    setDatosCierre((actuales) =>
      typeof actualizar === 'function'
        ? actualizar(actuales)
        : actualizar
    );
  }, []);

  // Guarda en caché la sección ya cargada (ítems, nombre, etc.) para no volver
  // a pedirla al backend cada vez que el usuario navega entre secciones ya visitadas.
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

  // Muestra el mensaje de "Cambios guardados correctamente" y lo oculta solo
  // después de 2.5 segundos.
  const mostrarGuardadoExitoso = useCallback(() => {
    setGuardadoExitoso(true);

    setTimeout(() => {
      setGuardadoExitoso(false);
    }, 2500);
  }, []);

  // Se ejecuta al presionar "Siguiente": si hay respuestas nuevas o
  // modificadas, las guarda en el backend (autoguardado); si todo sale bien,
  // avanza a la siguiente vista, o si ya era la última, abre la pantalla de cierre.
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

  // Regresa de la pantalla de cierre al formulario (sin perder los datos ya escritos).
  const volverDeCierre = useCallback(() => {
    setCierreActivo(false);
  }, []);

  // Cada vez que cambia algo relevante, guarda todo el progreso en
  // localStorage (a través de progresoInspeccionService). Si no hay una
  // inspección en curso, borra cualquier progreso guardado previamente.
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

  // Sube el scroll hasta arriba cada vez que se cambia de vista o se abre el cierre.
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [wizard.indice, cierreActivo]);

  // Abre el modal de confirmación para volver al menú principal.
  const volverAlInicio = useCallback(() => {
    setErrorSalida(null);
    setMostrarConfirmacionSalida(true);
  }, []);

  // Cierra el modal de confirmación sin hacer nada (a menos que ya se esté eliminando la inspección).
  const cancelarVolverAlInicio = useCallback(() => {
    if (eliminandoInspeccion) return;

    setErrorSalida(null);
    setMostrarConfirmacionSalida(false);
  }, [eliminandoInspeccion]);

  // Confirma la salida sin guardar: elimina la inspección en curso del
  // backend (si ya se había creado) y reinicia todo el estado local.
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

  // Regresa a la pantalla de selección de establecimiento, eliminando primero
  // la inspección en curso (se descarta, no se guarda a medias).
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

  // Se llama cuando el cierre de la inspección se completó con éxito: limpia
  // todo el estado y vuelve a la pantalla de inicio.
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

  // Permite cerrar el modal de confirmación de salida presionando la tecla Escape.
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

  // ---- A partir de aquí se decide qué pantalla mostrar ----

  // Pantalla de inicio (menú principal).
  if (pantallaActual === 'inicio') {
    return (
      <PantallaInicio
        onNuevaInspeccion={() =>
          setPantallaActual('inspeccion')
        }
        // NOTA: Historial, Reportes y Cerrar sesión todavía son solo
        // marcadores (console.log); falta conectarlos a una funcionalidad real.
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

  // Todavía no se eligió un establecimiento: se muestra la pantalla de selección.
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

  // Mensajes/modales que pueden aparecer sobre cualquier pantalla de la
  // inspección: aviso de guardado exitoso, error de guardado, y el modal de
  // confirmación para salir sin guardar.
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

  // El usuario ya completó todas las secciones y está en la pantalla de cierre.
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

  // Elige el componente de formulario según la vista actual (ver COMPONENTES_POR_CODIGO).
  const Formulario =
    COMPONENTES_POR_CODIGO[
      wizard.vistaActual?.codigo
    ] ?? FormularioSeccionAlimentos;

  // En la primera vista, "Anterior" regresa a la selección de establecimiento;
  // en las demás, simplemente retrocede una vista dentro del asistente.
  const manejarAnterior =
    wizard.indice === 0
      ? volverASeleccionEstablecimiento
      : wizard.retroceder;

  // Caso del componente genérico: necesita props extra (código, título) que
  // los componentes dedicados (B, C, H) no necesitan porque ya los conocen.
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

  // Caso de los componentes dedicados (B, C o H): ya saben pintar su propio contenido.
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