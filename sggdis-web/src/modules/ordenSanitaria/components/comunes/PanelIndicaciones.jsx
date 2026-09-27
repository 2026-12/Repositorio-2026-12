import { useState } from 'react';

export default function PanelIndicaciones({ titulo, children, abiertoInicial = false }) {
  const [abierto, setAbierto] = useState(abiertoInicial);

  return (
    <section className={`orden-panel ${abierto ? 'orden-panel--abierto' : ''}`}>
      <button type="button" className="orden-panel__boton" onClick={() => setAbierto((actual) => !actual)}>
        <span>{titulo}</span>
        <span>{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && <div className="orden-panel__contenido">{children}</div>}
    </section>
  );
}