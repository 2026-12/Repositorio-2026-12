import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

// NOTA: este componente ya no se usa (App.jsx renderiza la Sección E
// directamente con FormularioSeccionAlimentos). Se puede eliminar con confianza.
export default function FormularioSeccionE(props) {
  return <FormularioSeccionAlimentos {...props} codigo="E" titulo="Salud e Higiene del Personal" paso={5} tabActivo={6} />;
}
