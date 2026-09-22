// Banner de error/advertencia reutilizable para mostrar fallos.
// Props:
//   - titulo (requerido): título del error
//   - mensaje (requerido): mensaje descriptivo
//   - tipo (opcional): 'error' (default) o 'advertencia'
export default function AlertaError({ titulo, mensaje, tipo = 'error' }) {
  const estaAdvertencia = tipo === 'advertencia';

  return (
    <div 
      className={`alerta-validacion-error ${estaAdvertencia ? 'alerta-validacion-error--advertencia' : ''}`}
      role="alert"
    >
      <span className="alerta-validacion-error__titulo">{titulo}</span>
      <span>{mensaje}</span>
    </div>
  );
}