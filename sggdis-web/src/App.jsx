import { useCallback, useEffect, useState } from 'react';
import SeleccionEstablecimiento from './components/SeleccionEstablecimiento';
import FormularioSeccionB from './components/FormularioSeccionB';
import FormularioSeccionC from './components/FormularioSeccionC';
import FormularioSeccionAlimentos from './components/FormularioSeccionAlimentos';
import FormularioSeccionH from './components/FormularioSeccionH';
import { useWizardInspeccion } from './hooks/useWizardInspeccion';
import { cargarProgreso, guardarProgreso, limpiarProgreso } from './services/progresoInspeccionService';
import { eliminarInspeccion, guardarRespuestas } from './services/inspeccionesService';

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

const actualizarObservaciones = useCallback((actualizar) => {
  setObservaciones((actuales) => (typeof actualizar === 'function' ? actualizar(actuales) : actualizar));
}, []);

  const actualizarRespuestas = useCallback((actualizar) => {
    setRespuestas((actuales) => (typeof actualizar === 'function' ? actualizar(actuales) : actualizar));
  }, []);

  const registrarSeccion = useCallback((codigo, seccion) => {
    setSeccionesCache((actuales) => (actuales[codigo] === seccion ? actuales : { ...actuales, [codigo]: seccion }));
  }, []);

  // Al pasar de sección se guardan únicamente las respuestas modificadas en el backend.
  // No se bloquea el avance si falla (soporte sin conexión: el progreso ya quedó
  // en localStorage y se reintentará en el próximo cambio de sección).
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
    wizard.avanzar();
  }, [datos?.idInspeccion, respuestas, respuestasGuardadas, wizard]);

  // Guarda el progreso en cada cambio para poder continuar sin conexión o tras recargar la página.
useEffect(() => {
  if (!datos) {
    limpiarProgreso();
    return;
  }
  guardarProgreso({ datos, respuestas, respuestasGuardadas, seccionesCache, observaciones, indiceWizard: wizard.indice });
}, [datos, respuestas, respuestasGuardadas, seccionesCache, observaciones, wizard.indice]);

  // Al cambiar de sección (o subsección) llevar la vista al inicio de la página.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [wizard.indice]);

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
  wizard.reiniciar();
  }, [datos?.idInspeccion, wizard]);

  if (!datos) {
    return <SeleccionEstablecimiento onComenzar={setDatos} />;
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