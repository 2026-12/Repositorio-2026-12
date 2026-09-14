import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

// NOTA: este componente ya no se usa (App.jsx renderiza la Sección D
// directamente con FormularioSeccionAlimentos). Se puede eliminar con confianza.
export default function FormularioSeccionD(props) {
  return <FormularioSeccionAlimentos {...props} codigo="D" titulo="Medidas de Saneamiento" paso={4} tabActivo={3} />;
}
