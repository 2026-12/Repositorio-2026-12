import { useCallback, useEffect, useState } from 'react';
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
  const [datos, setDatos] = useState(progresoGuardado?.datos ?? null);
  const [respuestas, setRespuestas] = useState(progresoGuardado?.respuestas ?? {});
  const [respuestasGuardadas, setRespuestasGuardadas] = useState(progresoGuardado?.respuestasGuardadas ?? {});
  const [seccionesCache, setSeccionesCache] = useState(progresoGuardado?.seccionesCache ?? {});
  const wizard = useWizardInspeccion(datos?.secciones ?? [], progresoGuardado?.indiceWizard ?? 0);
  const [observaciones, setObservaciones] = useState(progresoGuardado?.observaciones ?? {});
  const [cierreActivo, setCierreActivo] = useState(progresoGuardado?.cierreActivo ?? false);
  const [datosCierre, setDatosCierre] = useState(progresoGuardado?.datosCierre ?? DATOS_CIERRE_INICIALES);

  const actualizarObservaciones = useCallback((actualizar) => {
    setObservaciones((actuales) => (typeof actualizar === 'function' ? actualizar(actuales) : actualizar));
  }, []);

  const actualizarRespuestas = useCallback((actualizar) => {
    setRespuestas((actuales) => (typeof actualizar === 'function' ? actualizar(actuales) : actualizar));
  }, []);

  const actualizarDatosCierre = useCallback((actualizar) => {
    setDatosCierre((actuales) => (typeof actualizar === 'function' ? actualizar(actuales) : actualizar));
  }, []);

  const registrarSeccion = useCallback((codigo, seccion) => {
    setSeccionesCache((actuales) => (actuales[codigo] === seccion ? actuales : { ...actuales, [codigo]: seccion }));
  }, []);

  // Al pasar de sección se guardan únicamente las respuestas modificadas en el backend.
  // No se bloquea el avance si falla (soporte sin conexión: el progreso ya quedó
  // en localStorage y se reintentará en el próximo cambio de sección).
  // Si ya no hay más secciones (última vista), en vez de "avanzar" se
  // habilita la pantalla de cierre.
  const avanzarYGuardar = useCallback(() => {
    if (datos?.idInspeccion) {
      const delta = obtenerRespuestasModificadas(respuestas, respuestasGuardadas);
      if (Object.keys(delta).length > 0) {
        guardarRespuestas(datos.idInspeccion, delta)
          .then(() => {
            setRespuestasGuardadas((actuales) => ({ ...actuales, ...delta }));
          })
          .catch((error) => {
            console.error('No se pudieron guardar las respuestas en el servidor:', error);
          });
      }
    }
    if (wizard.puedeAvanzar) {
      wizard.avanzar();
    } else {
      setCierreActivo(true);
    }
  }, [datos?.idInspeccion, respuestas, respuestasGuardadas, wizard]);

  // Regresar de la pantalla de cierre a la última sección del wizard.
  const volverDeCierre = useCallback(() => {
    setCierreActivo(false);
  }, []);

  // Guarda el progreso en cada cambio para poder continuar sin conexión o tras recargar la página.
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
      cierreActivo,
      datosCierre, 
    });
  }, [datos, respuestas, respuestasGuardadas, seccionesCache, observaciones, wizard.indice, cierreActivo, datosCierre]);

  // Al cambiar de sección (o subsección) llevar la vista al inicio de la página.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [wizard.indice, cierreActivo]);

  // En la Sección A (primer paso del wizard) no hay una sección previa a la
  // cual retroceder, así que "Anterior" regresa a la pantalla de inicio.
  const volverAlInicio = useCallback(async () => {
    if (!window.confirm('¿Deseás volver al inicio? Se perderá el progreso de esta inspección.')) {
      return;
    }
    if (datos?.idInspeccion) {
      try {
        await eliminarInspeccion(datos.idInspeccion);
      } catch (error) {
        window.alert(`No se pudo eliminar la inspección: ${error.message}`);
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
    wizard.reiniciar();
  }, [datos?.idInspeccion, wizard]);

  // Al confirmar el cierre en el servidor, se limpia todo el estado
  // (la inspección ya quedó FINALIZADA, no se elimina) para permitir una nueva.
  const manejarInspeccionFinalizada = useCallback(() => {
    setDatos(null);
    setRespuestas({});
    setRespuestasGuardadas({});
    setSeccionesCache({});
    setObservaciones({});
    setCierreActivo(false);
    setDatosCierre(DATOS_CIERRE_INICIALES);
    wizard.reiniciar();
  }, [wizard]);

  if (!datos) {
    return <SeleccionEstablecimiento onComenzar={setDatos} />;
  }

  // Pantalla de cierre, último paso del wizard.
  if (cierreActivo) {
    return (
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
    );
  }

  const Formulario = COMPONENTES_POR_CODIGO[wizard.vistaActual?.codigo] ?? FormularioSeccionAlimentos;
  const manejarAnterior = wizard.indice === 0 ? volverAlInicio : wizard.retroceder;

  if (Formulario === FormularioSeccionAlimentos) {
    return (
      <Formulario
        datos={datos}
        codigo={wizard.vistaActual?.codigo}
        titulo={wizard.vistaActual?.secciones[0]?.nombre ?? 'Sección de inspección'}
        paso={wizard.indice + 1}
        tabActivo={wizard.indice}
        onAnterior={manejarAnterior}
        onSiguiente={avanzarYGuardar}
        puedeRetroceder
        respuestas={respuestas}
        onRespuestasChange={actualizarRespuestas}
        seccionInicial={seccionesCache[wizard.vistaActual?.codigo]}
        seccionesCache={seccionesCache}
        onSeccionCargada={registrarSeccion}
        onIrAVista={wizard.irAVista}
        maxAlcanzado={wizard.maxAlcanzado}
        indiceActual={wizard.indice}
        vistas={wizard.vistas}
      />
    );
  }

  return (
    <Formulario
      datos={datos}
      onAnterior={manejarAnterior}
      onSiguiente={avanzarYGuardar}
      puedeRetroceder
      puedeAvanzar={wizard.puedeAvanzar}
      respuestas={respuestas}
      onRespuestasChange={actualizarRespuestas}
      observaciones={observaciones}
      onObservacionesChange={actualizarObservaciones}
      paso={wizard.indice + 1}
      totalPasos={wizard.vistas.length}
      seccionesCache={seccionesCache}
      onSeccionCargada={registrarSeccion}
      onIrAVista={wizard.irAVista}
      maxAlcanzado={wizard.maxAlcanzado}
      indiceActual={wizard.indice}
      vistas={wizard.vistas}
    />
  );
}

export default App;