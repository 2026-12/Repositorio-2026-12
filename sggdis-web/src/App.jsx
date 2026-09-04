import { useCallback, useEffect, useState } from 'react';
import SeleccionEstablecimiento from './components/SeleccionEstablecimiento';
import FormularioSeccionB from './components/FormularioSeccionB';
import FormularioSeccionC from './components/FormularioSeccionC';
import FormularioSeccionGenerico from './components/FormularioSeccionGenerico';
import { useWizardInspeccion } from './hooks/useWizardInspeccion';
import { cargarProgreso, guardarProgreso, limpiarProgreso } from './services/progresoInspeccionService';

const COMPONENTES_POR_CODIGO = {
  A: FormularioSeccionGenerico,
  B: FormularioSeccionB,
  C: FormularioSeccionC,
  D: FormularioSeccionGenerico,
  E: FormularioSeccionGenerico,
  F: FormularioSeccionGenerico,
  G: FormularioSeccionGenerico,
};

function App() {
  const [progresoGuardado] = useState(cargarProgreso);
  const [datos, setDatos] = useState(progresoGuardado?.datos ?? null);
  const [respuestas, setRespuestas] = useState(progresoGuardado?.respuestas ?? {});
  const [seccionesCache, setSeccionesCache] = useState(progresoGuardado?.seccionesCache ?? {});
  const wizard = useWizardInspeccion(datos?.secciones ?? [], progresoGuardado?.indiceWizard ?? 0);

  const actualizarRespuestas = useCallback((actualizar) => {
    setRespuestas((actuales) => (typeof actualizar === 'function' ? actualizar(actuales) : actualizar));
  }, []);

  const registrarSeccion = useCallback((codigo, seccion) => {
    setSeccionesCache((actuales) => (actuales[codigo] === seccion ? actuales : { ...actuales, [codigo]: seccion }));
  }, []);

  // Guarda el progreso en cada cambio para poder continuar sin conexión o tras recargar la página.
  useEffect(() => {
    if (!datos) {
      limpiarProgreso();
      return;
    }
    guardarProgreso({ datos, respuestas, seccionesCache, indiceWizard: wizard.indice });
  }, [datos, respuestas, seccionesCache, wizard.indice]);

  // Al cambiar de sección (o subsección) llevar la vista al inicio de la página.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [wizard.indice]);

  // En la Sección A (primer paso del wizard) no hay una sección previa a la
  // cual retroceder, así que "Anterior" regresa a la pantalla de inicio.
  const volverAlInicio = useCallback(() => {
    if (!window.confirm('¿Deseás volver al inicio? Se perderá el progreso de esta inspección.')) {
      return;
    }
    setDatos(null);
    setRespuestas({});
    setSeccionesCache({});
    wizard.reiniciar();
  }, [wizard]);

  if (!datos) {
    return <SeleccionEstablecimiento onComenzar={setDatos} />;
  }

  const Formulario = COMPONENTES_POR_CODIGO[wizard.vistaActual?.codigo] ?? FormularioSeccionGenerico;
  const manejarAnterior = wizard.indice === 0 ? volverAlInicio : wizard.retroceder;

  if (Formulario === FormularioSeccionGenerico) {
    return (
      <Formulario
        datos={datos}
        codigo={wizard.vistaActual?.codigo}
        titulo={wizard.vistaActual?.secciones[0]?.nombre ?? 'Sección de inspección'}
        paso={wizard.indice + 1}
        tabActivo={wizard.indice}
        onAnterior={manejarAnterior}
        onSiguiente={wizard.avanzar}
        puedeRetroceder
        respuestas={respuestas}
        onRespuestasChange={actualizarRespuestas}
        seccionInicial={seccionesCache[wizard.vistaActual?.codigo]}
        onSeccionCargada={registrarSeccion}
      />
    );
  }

  return (
    <Formulario
      datos={datos}
      onAnterior={manejarAnterior}
      onSiguiente={wizard.avanzar}
      puedeRetroceder
      puedeAvanzar={wizard.puedeAvanzar}
      respuestas={respuestas}
      onRespuestasChange={actualizarRespuestas}
      seccionesCache={seccionesCache}
      onSeccionCargada={registrarSeccion}
    />
  );
}

export default App;