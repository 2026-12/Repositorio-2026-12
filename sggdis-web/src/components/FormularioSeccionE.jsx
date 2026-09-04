import FormularioSeccionGenerico from './FormularioSeccionGenerico';

export default function FormularioSeccionE(props) {
  return <FormularioSeccionGenerico {...props} codigo="E" titulo="Salud e Higiene del Personal" paso={5} tabActivo={6} />;
}
