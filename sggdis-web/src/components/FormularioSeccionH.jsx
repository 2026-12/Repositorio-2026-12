import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

// NOTA: este componente reutiliza directamente FormularioSeccionAlimentos para mantener la misma estructura y comportamiento que las demás secciones.
export default function FormularioSeccionH(props) {
  return <FormularioSeccionAlimentos {...props} codigo="H" titulo="Servicio de Catering" paso={8} tabActivo={7} />;
}