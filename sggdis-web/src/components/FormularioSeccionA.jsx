import FormularioSeccionGenerico from './FormularioSeccionGenerico';

export default function FormularioSeccionA(props) {
  return <FormularioSeccionGenerico {...props} codigo="A" titulo="Condiciones Físicas y Sanitarias Generales de las Instalaciones" paso={1} />;
}
