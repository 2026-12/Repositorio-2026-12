// Modal de confirmación para salir de una inspección en curso sin guardarla.
export default function ModalConfirmacionSalida({ error, eliminando, onCancelar, onConfirmar }) {
  return (
    <div className="modal-overlay">
      <div className="modal-confirmacion" role="dialog" aria-modal="true" aria-labelledby="titulo-confirmacion-salida">
        <h2 id="titulo-confirmacion-salida">¿Volver al menú principal?</h2>

        <p>Si sale de la inspección sin guardar, se perderá el progreso registrado.</p>

        {error && (
          <div className="modal-error" role="alert">
            <strong>No se pudo completar la acción</strong>
            <span>{error}</span>
          </div>
        )}

        <div className="modal-confirmacion__acciones">
          <button type="button" className="boton-modal boton-modal--secundario" onClick={onCancelar} disabled={eliminando}>
            Cancelar
          </button>

          {/* Botón deshabilitado a propósito: la función "Guardar borrador" aún no está implementada. */}
          <button
            type="button"
            className="boton-modal boton-modal--secundario"
            disabled
            title="Esta funcionalidad estará disponible próximamente"
          >
            Guardar borrador
          </button>

          <button type="button" className="boton-modal boton-modal--primario" onClick={onConfirmar} disabled={eliminando}>
            {eliminando ? 'Saliendo…' : 'Salir'}
          </button>
        </div>
      </div>
    </div>
  );
}
