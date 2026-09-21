import FormularioSubseccionado from './FormularioSubseccionado';
import { MARCA_ALIMENTOS, TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS } from '../config/inspeccionAlimentos';

// En el backend la Sección B viene dividida en tres subsecciones con código propio.
const SUBSECCIONES_B = [
  {
    codigo: 'B1',
    titulo: 'Área de Preparación de Alimentos (Cocina) — Condiciones Físicas y Sanitarias',
  },
  {
    codigo: 'B2',
    titulo: 'Área de Preparación de Alimentos (Cocina) — Equipo y Utensilios',
  },
  {
    codigo: 'B3',
    titulo: 'Área de Preparación de Alimentos (Cocina) — Operaciones de Preparación de los Alimentos',
  },
];

// Adapta el núcleo compartido de secciones compuestas (FormularioSubseccionado)
// con las subsecciones y textos legales de la Sección B.
function FormularioSeccionB(props) {
  return (
    <FormularioSubseccionado
      {...props}
      subseccionesDisponibles={SUBSECCIONES_B}
      marca={MARCA_ALIMENTOS}
      textoAdvertenciaCritico={TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS}
    />
  );
}

export default FormularioSeccionB;