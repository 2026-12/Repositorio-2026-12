import { useEffect, useRef, useState } from 'react';
import PanelIndicaciones from '../comunes/PanelIndicaciones';
import FilaOrdenanza from './FilaOrdenanza';
import {
  TEXTO_VIGENCIA_ORDEN,
  TEXTO_MOTIVO,
  TEXTO_USO_INTERNO,
  TEXTO_FUNDAMENTO_LEGAL,
  TEXTO_APERCIBIMIENTO,
  TEXTO_RECURRENCIA,
} from '../../config/textosOrdenSanitaria';

export default function Ordenanzas({ ordenanzas, errores = {}, onAgregar, onActualizar, onEliminar }) {
  const nuevaOrdenanzaRef = useRef(null);
  const [cantidadAnterior, setCantidadAnterior] = useState(ordenanzas.length);

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

  return (
    <>
      <section className="orden-apartado">
        <h2>Ordenanzas</h2>
        <p>Registre las medidas sanitarias ordenadas y el plazo establecido para su cumplimiento.</p>
      </section>

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
                onChange={onActualizar}
                onEliminar={onEliminar}
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

      <div className="orden-paneles-legales">

        <PanelIndicaciones titulo="Motivo">
          {TEXTO_MOTIVO.map((texto, index) => (
            <p key={index}>{texto}</p>
          ))}
        </PanelIndicaciones>

        <PanelIndicaciones titulo="Para uso interno, considerar">
          {TEXTO_USO_INTERNO.map((texto, index) => (
            <p key={index}>{texto}</p>
          ))}
        </PanelIndicaciones>

        <PanelIndicaciones titulo="Fundamento Legal">
          <p>{TEXTO_FUNDAMENTO_LEGAL}</p>
        </PanelIndicaciones>

        <PanelIndicaciones titulo="Apercibimiento">
          {TEXTO_APERCIBIMIENTO.map((texto, index) => (
            <p key={index}>{texto}</p>
          ))}
        </PanelIndicaciones>

        <PanelIndicaciones titulo="Recurrencia">
          <p>{TEXTO_RECURRENCIA}</p>
        </PanelIndicaciones>

      </div>
    </>
  );
}