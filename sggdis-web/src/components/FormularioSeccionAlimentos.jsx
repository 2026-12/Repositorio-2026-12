import FormularioSeccionGenerico from './FormularioSeccionGenerico';
import {
  MARCA_ALIMENTOS,
  TABS_ALIMENTOS,
  TOTAL_PASOS_ALIMENTOS,
  TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS,
} from '../config/inspeccionAlimentos';

// Adapta el núcleo genérico de inspección con la identidad y textos legales
// de la guía de alimentos, para que ese núcleo siga sirviendo a otras guías.
export default function FormularioSeccionAlimentos(props) {
  return (
    <FormularioSeccionGenerico
      {...props}
      marca={MARCA_ALIMENTOS}
      tabs={TABS_ALIMENTOS}
      totalPasos={TOTAL_PASOS_ALIMENTOS}
      textoAdvertenciaCritico={TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS}
    />
  );
}
