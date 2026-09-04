import FormularioSeccionGenerico from './FormularioSeccionGenerico';

export default function FormularioSeccionD(props) {
  return <FormularioSeccionGenerico {...props} codigo="D" titulo="Medidas de Saneamiento" paso={4} tabActivo={3} />;
}
