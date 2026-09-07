import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

export default function FormularioSeccionF(props) {
  return <FormularioSeccionAlimentos {...props} codigo="F" titulo="Área de Consumo (Comedor)" paso={6} tabActivo={5} />;
}
