import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

// Reutiliza FormularioSeccionAlimentos tal cual, solo cambia código, título y paso.
export default function FormularioSeccionH(props) {
  return <FormularioSeccionAlimentos {...props} codigo="H" titulo="Servicio de Catering" paso={8} tabActivo={7} />;
}