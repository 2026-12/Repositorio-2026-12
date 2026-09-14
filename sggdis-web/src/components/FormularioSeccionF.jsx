import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

// NOTA: este componente ya no se usa (App.jsx renderiza la Sección F
// directamente con FormularioSeccionAlimentos). Se puede eliminar con confianza.
export default function FormularioSeccionF(props) {
  return <FormularioSeccionAlimentos {...props} codigo="F" titulo="Área de Consumo (Comedor)" paso={6} tabActivo={5} />;
}
