import { useEffect, useRef } from 'react';

// Modal de confirmación para eliminar una ordenanza de la Orden Sanitaria.
//
// Reutiliza las mismas clases visuales que ModalConfirmacionSalidaOrden
// (.orden-modal-overlay, .orden-modal-salida, .orden-modal-boton) para
// mantener el diseño institucional del módulo. El botón destructivo
// "Eliminar" usa la variante roja (estándar D06: rojo para acciones
// destructivas).
//
// Accesibilidad (estándar D06):
//   - role="dialog" + aria-modal + título y descripción enlazados.
//   - El foco inicia en "Cancelar" para evitar eliminaciones accidentales.
//   - La tecla Escape cancela la acción.

/**
 * Muestra la confirmación antes de eliminar una ordenanza.
 * @param {object} props
 * @param {number} props.numeroOrdenanza Número visible de la ordenanza (1, 2, 3...).
 * @param {() => void} props.onCancelar Cierra el modal sin eliminar.
 * @param {() => void} props.onConfirmar Elimina la ordenanza.
 */
export default function ModalConfirmacionEliminarOrdenanza({
  numeroOrdenanza,
  onCancelar,
  onConfirmar,
}) {
  const botonCancelarRef = useRef(null);

  // Coloca el foco en "Cancelar" al abrir y permite cerrar con Escape.
  useEffect(() => {
    botonCancelarRef.current?.focus();

    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') onCancelar();
    };

    document.addEventListener('keydown', manejarTecla);
    return () => document.removeEventListener('keydown', manejarTecla);
  }, [onCancelar]);

  return (
    <div className="orden-modal-overlay">
      <div
        className="orden-modal-salida"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orden-titulo-eliminar-ordenanza"
        aria-describedby="orden-descripcion-eliminar-ordenanza"
      >
        <h2 id="orden-titulo-eliminar-ordenanza">
          ¿Eliminar la Ordenanza {numeroOrdenanza}?
        </h2>

        <p id="orden-descripcion-eliminar-ordenanza">
          Se eliminará la ordenanza junto con su fundamento legal y su plazo de
          cumplimiento. Esta acción no se puede deshacer y las ordenanzas
          siguientes se volverán a numerar.
        </p>

        <div className="orden-modal-salida__acciones">
          <button
            ref={botonCancelarRef}
            type="button"
            className="orden-modal-boton orden-modal-boton--secundario"
            onClick={onCancelar}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="orden-modal-boton orden-modal-boton--primario"
            onClick={onConfirmar}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}