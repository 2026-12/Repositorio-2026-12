import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

export default function FormularioSeccionE(props) {
  return <FormularioSeccionAlimentos {...props} codigo="E" titulo="Salud e Higiene del Personal" paso={5} tabActivo={6} />;
}
