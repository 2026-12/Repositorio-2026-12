import { useState } from 'react';
import SeleccionEstablecimiento from './components/SeleccionEstablecimiento';
import FormularioSeccionA from './components/FormularioSeccionA';
import FormularioSeccionB from './components/FormularioSeccionB';

function App() {
  const [datos, setDatos] = useState(null);

  if (!datos) {
    return <SeleccionEstablecimiento onComenzar={setDatos} />;
  }

  return <FormularioSeccionB datos={datos} />;
}

export default App;