import { useState } from 'react';
import {
  TEXTO_MOTIVO,
  TEXTO_USO_INTERNO,
  TEXTO_FUNDAMENTO_LEGAL,
  TEXTO_APERCIBIMIENTO,
  TEXTO_RECURRENCIA,
} from '../../config/textosOrdenSanitaria';

const PANELES = [
  {
    id: 'motivo',
    titulo: 'Motivo',
    contenido: TEXTO_MOTIVO,
  },
  {
    id: 'uso-interno',
    titulo: 'Para uso interno, considerar',
    contenido: TEXTO_USO_INTERNO,
  },
  {
    id: 'fundamento-legal',
    titulo: 'Fundamento Legal',
    contenido: TEXTO_FUNDAMENTO_LEGAL,
  },
  {
    id: 'apercibimiento',
    titulo: 'Apercibimiento',
    contenido: TEXTO_APERCIBIMIENTO,
  },
  {
    id: 'recurrencia',
    titulo: 'Recurrencia',
    contenido: TEXTO_RECURRENCIA,
  },
];

export default function PanelIndicaciones() {
  const [panelActivo, setPanelActivo] = useState(null);

  const cambiarPanel = (id) => {
    setPanelActivo((actual) => actual === id ? null : id);
  };

  const panelSeleccionado = PANELES.find((panel) => panel.id === panelActivo);

  const renderizarContenido = (contenido) => {
    if (Array.isArray(contenido)) {
      return contenido.map((texto, index) => <p key={index}>{texto}</p>);
    }

    return <p>{contenido}</p>;
  };

  return (
    <section className="orden-paneles-legales">
      <div className="orden-paneles-legales__tabs">
        {PANELES.map((panel) => {
          const activo = panelActivo === panel.id;

          return (
            <button
              key={panel.id}
              type="button"
              className={`orden-panel-tab ${activo ? 'orden-panel-tab--activo' : ''}`}
              onClick={() => cambiarPanel(panel.id)}
              aria-expanded={activo}
            >
              <span>{panel.titulo}</span>

              <span
                className={`orden-panel-tab__flecha ${
                  activo ? 'orden-panel-tab__flecha--abierta' : ''
                }`}
              >
                ▾
              </span>
            </button>
          );
        })}
      </div>

      {panelSeleccionado && (
        <div className="orden-paneles-legales__desplegable">
          <div className="orden-paneles-legales__titulo">
            {panelSeleccionado.titulo}
          </div>

          <div className="orden-paneles-legales__contenido">
            {renderizarContenido(panelSeleccionado.contenido)}
          </div>
        </div>
      )}
    </section>
  );
}