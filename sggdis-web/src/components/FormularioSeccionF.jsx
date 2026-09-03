import FormularioSeccionGenerico from './FormularioSeccionGenerico';

export default function FormularioSeccionF(props) {
  return <FormularioSeccionGenerico {...props} codigo="F" titulo="Área de Consumo (Comedor)" paso={6} tabActivo={5} />;
}
