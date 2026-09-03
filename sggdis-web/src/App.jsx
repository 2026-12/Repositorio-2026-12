import { useCallback, useState } from 'react';
import SeleccionEstablecimiento from './components/SeleccionEstablecimiento';
import FormularioSeccionB from './components/FormularioSeccionB';
import FormularioSeccionC from './components/FormularioSeccionC';
import FormularioSeccionGenerico from './components/FormularioSeccionGenerico';
import { useWizardInspeccion } from './hooks/useWizardInspeccion';

const COMPONENTES_POR_CODIGO = {
  A: FormularioSeccionGenerico,
  B1: FormularioSeccionB,
  C1: FormularioSeccionC,
  D: FormularioSeccionGenerico,
  E: FormularioSeccionGenerico,
  F: FormularioSeccionGenerico,
  G: FormularioSeccionGenerico,
};

function App() {
  const [datos, setDatos] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [seccionesCache, setSeccionesCache] = useState({});
  const wizard = useWizardInspeccion(datos?.secciones ?? []);

  const actualizarRespuestas = useCallback((actualizar) => {
    setRespuestas((actuales) => (typeof actualizar === 'function' ? actualizar(actuales) : actualizar));
  }, []);

  const registrarSeccion = useCallback((codigo, seccion) => {
    setSeccionesCache((actuales) => (actuales[codigo] === seccion ? actuales : { ...actuales, [codigo]: seccion }));
  }, []);

  if (!datos) {
    return <SeleccionEstablecimiento onComenzar={setDatos} />;
  }

  const Formulario = COMPONENTES_POR_CODIGO[wizard.vistaActual?.codigo] ?? FormularioSeccionGenerico;

  if (Formulario === FormularioSeccionGenerico) {
    return (
      <Formulario
        datos={datos}
        codigo={wizard.vistaActual?.codigo}
        titulo={wizard.vistaActual?.secciones[0]?.nombre ?? 'Sección de inspección'}
        paso={wizard.indice + 1}
        tabActivo={wizard.indice}
        onAnterior={wizard.retroceder}
        onSiguiente={wizard.avanzar}
        puedeRetroceder={wizard.puedeRetroceder}
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
      onAnterior={wizard.retroceder}
      onSiguiente={wizard.avanzar}
      puedeRetroceder={wizard.puedeRetroceder}
      puedeAvanzar={wizard.puedeAvanzar}
      respuestas={respuestas}
      onRespuestasChange={actualizarRespuestas}
      seccionesCache={seccionesCache}
      onSeccionCargada={registrarSeccion}
    />
  );
}

export default App;