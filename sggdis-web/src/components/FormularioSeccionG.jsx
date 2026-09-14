import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

// NOTA: este componente ya no se usa (App.jsx renderiza la Sección G
// directamente con FormularioSeccionAlimentos). Se puede eliminar con confianza.
export default function FormularioSeccionG(props) {
  return <FormularioSeccionAlimentos {...props} codigo="G" titulo="Servicio a Domicilio" paso={7} tabActivo={6} />;
}
