// Modal de confirmación para salir de una Orden Sanitaria en curso sin emitirla.
// Mismo diseño y textos que el modal "¿Volver al menú principal?" del Acta
// General, con las clases propias del módulo de Orden Sanitaria.
export default function ModalConfirmacionSalidaOrden({
  onCancelar,
  onConfirmar,
}) {
  return (
    <div className="orden-modal-overlay">
      <div
        className="orden-modal-salida"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orden-titulo-confirmacion-salida"
      >
        <h2 id="orden-titulo-confirmacion-salida">¿Volver al menú principal?</h2>

        <p>
          Si sale de esta orden ahora, se descarta por completo: el progreso registrado
          se pierde y la próxima vez que entre a Orden Sanitaria va a empezar una orden nueva.
        </p>

        <div className="orden-modal-salida__acciones">
          <button
            type="button"
            className="orden-modal-boton orden-modal-boton--secundario"
            onClick={onCancelar}
          >
            Cancelar
          </button>

          {/* Botón deshabilitado a propósito: la función "Guardar borrador" aún no está implementada. */}
          <button
            type="button"
            className="orden-modal-boton orden-modal-boton--secundario"
            disabled
            title="Esta funcionalidad estará disponible próximamente"
          >
            Guardar borrador
          </button>

          <button
            type="button"
            className="orden-modal-boton orden-modal-boton--azul"
            onClick={onConfirmar}
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}