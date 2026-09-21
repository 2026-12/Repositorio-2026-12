import FormularioSubseccionado from './FormularioSubseccionado';
import { MARCA_ALIMENTOS, TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS } from '../config/inspeccionAlimentos';

// En el backend la Sección C viene dividida en dos subsecciones con código propio.
const SUBSECCIONES_C = [
  {
    codigo: 'C1',
    titulo: 'Bodega de Insumos — Condiciones Físicas y Sanitarias',
  },
  {
    codigo: 'C2',
    titulo: 'Bodega de Insumos — Condiciones de Almacenamiento',
  },
];

// Adapta el núcleo compartido de secciones compuestas (FormularioSubseccionado)
// con las subsecciones y textos legales de la Sección C.
function FormularioSeccionC(props) {
  return (
    <FormularioSubseccionado
      {...props}
      subseccionesDisponibles={SUBSECCIONES_C}
      marca={MARCA_ALIMENTOS}
      textoAdvertenciaCritico={TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS}
    />
  );
}

export default FormularioSeccionC;