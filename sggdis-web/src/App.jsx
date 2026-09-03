import { useState } from 'react';
import SeleccionEstablecimiento from './components/SeleccionEstablecimiento';
import FormularioSeccionA from './components/FormularioSeccionA';

function App() {
  const [datos, setDatos] = useState(null);

  if (!datos) {
    return <SeleccionEstablecimiento onComenzar={setDatos} />;
  }

  return (
    <FormularioSeccionA
      datos={datos}
      onCompletar={() => {
        // TEMPORAL: aquí se encadenará la Sección B cuando ese componente exista.
        alert('Sección A completa. La siguiente sección se conectará cuando esté lista.');
      }}
    />
  );
}

export default App;