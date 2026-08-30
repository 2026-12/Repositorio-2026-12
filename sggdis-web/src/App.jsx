import { useState } from 'react';
import SeleccionEstablecimiento from './components/SeleccionEstablecimiento';
import FormularioSeccionA from './components/FormularioSeccionA';

function App() {
  const [datos, setDatos] = useState(null);

  if (!datos) {
    return <SeleccionEstablecimiento onComenzar={setDatos} />;
  }

  return <FormularioSeccionA datos={datos} />;
}

export default App;