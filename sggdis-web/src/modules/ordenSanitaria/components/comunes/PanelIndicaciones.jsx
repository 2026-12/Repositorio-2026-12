import { useState } from 'react';

export default function PanelIndicaciones({
  titulo = 'Indicaciones',
  textos = [],
  abiertoInicialmente = false,
}) {
  const [abierto, setAbierto] = useState(
    abiertoInicialmente,
  );

  if (!textos.length) {
    return null;
  }

  return (
    <div className="orden-sanitaria__indicaciones">
      <button
        type="button"
        className="orden-sanitaria__indicaciones-boton"
        onClick={() => setAbierto((actual) => !actual)}
        aria-expanded={abierto}
      >
        <span>
          ⓘ {titulo}
        </span>

        <span
          className="orden-sanitaria__indicaciones-icono"
          aria-hidden="true"
        >
          {abierto ? '▲' : '▼'}
        </span>
      </button>

      {abierto && (
        <div className="orden-sanitaria__indicaciones-contenido">
          {textos.map((texto, indice) => (
            <p key={`${titulo}-${indice}`}>
              {texto}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}