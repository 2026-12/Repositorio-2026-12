// Modal de confirmación para salir de una Orden Sanitaria en curso.
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

        <h2 id="orden-titulo-confirmacion-salida">
          ¿Volver al menú principal?
        </h2>

        <p>
          Si sale de la Orden Sanitaria sin guardar, se perderá el progreso registrado.
        </p>

        <div className="orden-modal-salida__acciones">

          <button
            type="button"
            className="orden-modal-boton orden-modal-boton--secundario"
            onClick={onCancelar}
          >
            Cancelar
          </button>

          {/* 
            Botón deshabilitado a propósito.
            "Guardar borrador" todavía NO está implementado.
          */}
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
            className="orden-modal-boton orden-modal-boton--primario"
            onClick={onConfirmar}
          >
            Salir
          </button>

        </div>

      </div>

    </div>
  );
}