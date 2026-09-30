// Modal de confirmación para salir del Acta General en curso sin terminarla.
// Se usa el mismo patrón que el módulo de Guía de Inspección (mismo hook
// useConfirmacionSalida), pero con estilos y texto propios del Acta General.
function ModalConfirmacionSalida({ error, eliminando, onCancelar, onConfirmar }) {
  return (
    <div className="acta-modal-overlay">
      <div
        className="acta-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-confirmacion-salida-acta"
      >
        <h2 id="titulo-confirmacion-salida-acta">¿Volver al menú principal?</h2>

        <p>
          Si sale de esta acta ahora, se descarta por completo: la próxima vez que entre a
          Acta General va a empezar una acta nueva, con todos los campos en blanco.
        </p>

        {error && (
          <div className="acta-modal__error" role="alert">
            <strong>No se pudo completar la acción</strong>
            <span>{error}</span>
          </div>
        )}

        <div className="acta-modal__acciones">
          <button
            type="button"
            className="acta-boton-modal acta-boton-modal--secundario"
            onClick={onCancelar}
            disabled={eliminando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="acta-boton-modal acta-boton-modal--primario"
            onClick={onConfirmar}
            disabled={eliminando}
          >
            {eliminando ? 'Saliendo…' : 'Salir y descartar acta'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmacionSalida;
