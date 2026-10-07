import { useCallback, useEffect, useRef, useState } from 'react';

import PanelIndicaciones from '../comunes/PanelIndicaciones';
import ModalConfirmacionEliminarOrdenanza from '../comunes/ModalConfirmacionEliminarOrdenanza';
import FilaOrdenanza from './FilaOrdenanza';

import { TEXTO_VIGENCIA_ORDEN } from '../../config/textosOrdenSanitaria';

/**
 * Paso "Ordenanzas" de la Orden Sanitaria: lista las ordenanzas, permite
 * agregar nuevas y solicita confirmación antes de eliminar una (EH3-02).
 * @param {object} props
 * @param {object[]} props.ordenanzas Ordenanzas registradas.
 * @param {object} props.errores Errores de validación por campo.
 * @param {string} props.fechaNotificacion Fecha mínima para plazos tipo FECHA.
 * @param {() => void} props.onAgregar Agrega una ordenanza vacía al final.
 * @param {(index: number, ordenanza: object) => void} props.onActualizar Actualiza una ordenanza.
 * @param {(index: number) => void} props.onEliminar Elimina definitivamente una ordenanza.
 */
export default function Ordenanzas({
  ordenanzas,
  errores = {},
  fechaNotificacion = '',
  onAgregar,
  onActualizar,
  onEliminar,
}) {
  const nuevaOrdenanzaRef = useRef(null);
  const [cantidadAnterior, setCantidadAnterior] = useState(ordenanzas.length);

  // Índice de la ordenanza que el inspector pidió eliminar; null = modal cerrado.
  const [indicePorEliminar, setIndicePorEliminar] = useState(null);

  // Desplaza la vista hasta la ordenanza recién agregada.
  useEffect(() => {
    if (ordenanzas.length > cantidadAnterior) {
      requestAnimationFrame(() => {
        nuevaOrdenanzaRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }

    setCantidadAnterior(ordenanzas.length);
  }, [ordenanzas.length, cantidadAnterior]);

  /**
   * Abre el modal de confirmación en lugar de eliminar de inmediato.
   * @param {number} index Posición de la ordenanza en la lista.
   */
  const solicitarEliminarOrdenanza = useCallback((index) => {
    setIndicePorEliminar(index);
  }, []);

  /** Cierra el modal sin eliminar nada. */
  const cancelarEliminarOrdenanza = useCallback(() => {
    setIndicePorEliminar(null);
  }, []);

  /** Elimina la ordenanza seleccionada y cierra el modal. */
  const confirmarEliminarOrdenanza = useCallback(() => {
    if (indicePorEliminar !== null) {
      onEliminar(indicePorEliminar);
    }

    setIndicePorEliminar(null);
  }, [indicePorEliminar, onEliminar]);

  return (
    <>
      <section className="orden-apartado">
        <h2>Ordenanzas</h2>

        <p>
          Registre las medidas sanitarias ordenadas y el plazo establecido para
          su cumplimiento.
        </p>
      </section>

      <PanelIndicaciones />

      <div className="orden-vigencia">
        <strong>{TEXTO_VIGENCIA_ORDEN}</strong>
      </div>

      <div className="orden-listado">
        {ordenanzas.map((ordenanza, index) => {
          const esUltima = index === ordenanzas.length - 1;

          return (
            <div
              key={index}
              ref={esUltima ? nuevaOrdenanzaRef : null}
              className="orden-ordenanza-destino"
            >
              <FilaOrdenanza
                ordenanza={ordenanza}
                index={index}
                errores={errores}
                fechaNotificacion={fechaNotificacion}
                onChange={onActualizar}
                onEliminar={solicitarEliminarOrdenanza}
                onAgregar={onAgregar}
                puedeEliminar={ordenanzas.length > 1}
                mostrarAgregar={esUltima}
              />
            </div>
          );
        })}
      </div>

      {errores.ordenanzas && (
        <span className="orden-error">{errores.ordenanzas}</span>
      )}

      {indicePorEliminar !== null && (
        <ModalConfirmacionEliminarOrdenanza
          numeroOrdenanza={indicePorEliminar + 1}
          onCancelar={cancelarEliminarOrdenanza}
          onConfirmar={confirmarEliminarOrdenanza}
        />
      )}
    </>
  );
}