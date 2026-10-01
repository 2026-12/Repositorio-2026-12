import { useEffect, useRef, useState } from 'react';

function SelectorOrden({ id, label, value, opciones = [], placeholder, disabled = false, idCampo, nombreCampo, onChange, error }) {
  const [abierto, setAbierto] = useState(false);
  const referencia = useRef(null);

  const seleccionada = opciones.find((opcion) => String(opcion[idCampo]) === String(value));

  useEffect(() => {
    const cerrarSelector = (evento) => {
      if (referencia.current && !referencia.current.contains(evento.target)) setAbierto(false);
    };

    document.addEventListener('mousedown', cerrarSelector);
    return () => document.removeEventListener('mousedown', cerrarSelector);
  }, []);

  useEffect(() => {
    if (disabled) setAbierto(false);
  }, [disabled]);

  return (
    <div className="orden-campo" ref={referencia}>
      <label htmlFor={id}>{label}</label>

      <div className={`orden-selector ${abierto ? 'orden-selector--abierto' : ''}`}>
        <button
          id={id}
          type="button"
          className="orden-selector__boton"
          onClick={() => !disabled && setAbierto((actual) => !actual)}
          disabled={disabled}
          aria-expanded={abierto}
        >
          <span className={seleccionada ? '' : 'orden-selector__placeholder'}>
            {seleccionada ? seleccionada[nombreCampo] : placeholder}
          </span>

          <span className={`orden-selector__flecha ${abierto ? 'orden-selector__flecha--abierta' : ''}`}>
            ▾
          </span>
        </button>

        {abierto && !disabled && (
          <div className="orden-selector__opciones">
            <button
              type="button"
              className="orden-selector__opcion orden-selector__opcion--placeholder"
              onClick={() => {
                onChange('');
                setAbierto(false);
              }}
            >
              {placeholder}
            </button>

            {opciones.map((opcion) => {
              const activa = String(opcion[idCampo]) === String(value);

              return (
                <button
                  key={opcion[idCampo]}
                  type="button"
                  className={`orden-selector__opcion ${activa ? 'orden-selector__opcion--seleccionada' : ''}`}
                  onClick={() => {
                    onChange(Number(opcion[idCampo]));
                    setAbierto(false);
                  }}
                >
                  {opcion[nombreCampo]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && <span className="orden-error">{error}</span>}
    </div>
  );
}

export default function Ubicacion({ datos, errores = {}, provincias = [], cantones = [], distritos = [], onChange }) {
  const cambiarProvincia = (valor) => {
    onChange('idProvincia', valor);
    onChange('idCanton', '');
    onChange('idDistrito', '');
  };

  const cambiarCanton = (valor) => {
    onChange('idCanton', valor);
    onChange('idDistrito', '');
  };

  return (
    <>
      <section className="orden-apartado">
        <h2>Ubicación</h2>
        <p>Complete la información correspondiente a la ubicación y dirección exacta para notificar.</p>
      </section>

      <section className="orden-grupo orden-grupo--ubicacion">
        <div className="orden-grupo__titulo">Ubicación para notificar</div>

        <div className="orden-grupo__contenido">
          <div className="orden-grid-3 orden-grid-ubicacion">
            <SelectorOrden
              id="provincia"
              label="Provincia"
              value={datos.idProvincia}
              opciones={provincias}
              placeholder="Seleccione una provincia"
              idCampo="idProvincia"
              nombreCampo="nombre"
              onChange={cambiarProvincia}
              error={errores.idProvincia}
            />

            <SelectorOrden
              id="canton"
              label="Cantón"
              value={datos.idCanton}
              opciones={cantones}
              placeholder="Seleccione un cantón"
              disabled={!datos.idProvincia}
              idCampo="idCanton"
              nombreCampo="nombre"
              onChange={cambiarCanton}
              error={errores.idCanton}
            />

            <SelectorOrden
              id="distrito"
              label="Distrito"
              value={datos.idDistrito}
              opciones={distritos}
              placeholder="Seleccione un distrito"
              disabled={!datos.idCanton}
              idCampo="idDistrito"
              nombreCampo="nombre"
              onChange={(valor) => onChange('idDistrito', valor)}
              error={errores.idDistrito}
            />
          </div>

          <div className="orden-campo">
            <label htmlFor="direccionExacta">Dirección exacta para notificar </label>
            <textarea
              id="direccionExacta"
              value={datos.direccionExacta || ''}
              onChange={(e) => onChange('direccionExacta', e.target.value)}
            />
            {errores.direccionExacta && <span className="orden-error">{errores.direccionExacta}</span>}
          </div>
        </div>
      </section>
    </>
  );
}