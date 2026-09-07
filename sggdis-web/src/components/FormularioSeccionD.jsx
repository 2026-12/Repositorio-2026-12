import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

export default function FormularioSeccionD(props) {
  return <FormularioSeccionAlimentos {...props} codigo="D" titulo="Medidas de Saneamiento" paso={4} tabActivo={3} />;
}
