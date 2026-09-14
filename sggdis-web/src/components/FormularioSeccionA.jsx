import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

// NOTA: este componente ya no se usa. App.jsx ahora renderiza la Sección A
// directamente con FormularioSeccionAlimentos (ver COMPONENTES_POR_CODIGO en
// App.jsx). Se puede eliminar este archivo con confianza, o dejarlo si se
// prefiere conservar como referencia histórica.
export default function FormularioSeccionA(props) {
  return <FormularioSeccionAlimentos {...props} codigo="A" titulo="Condiciones Físicas y Sanitarias Generales de las Instalaciones" paso={1} />;
}
