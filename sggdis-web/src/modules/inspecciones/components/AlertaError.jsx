// Banner de error reutilizable para mostrar un fallo con título + mensaje.
export default function AlertaError({ titulo, mensaje }) {
  return (
    <div className="alerta-validacion-error" role="alert">
      <span className="alerta-validacion-error__titulo">{titulo}</span>
      <span>{mensaje}</span>
    </div>
  );
}
