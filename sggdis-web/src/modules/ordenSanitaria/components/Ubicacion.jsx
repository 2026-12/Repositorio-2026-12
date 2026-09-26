import {
  TEXTOS_ORDEN_SANITARIA,
} from '../config/textosOrdenSanitaria';

import PanelIndicaciones
  from './comunes/PanelIndicaciones';

export default function Ubicacion({
  datos,
  errores = {},
  onChange,
  provincias = [],
  cantones = [],
  distritos = [],
}) {
  const manejarCambio = (campo) => (event) => {
    onChange(campo, event.target.value);
  };

  return (
    <section className="orden-sanitaria__seccion">
      <span className="orden-sanitaria__adaptado">
        ORDEN SANITARIA
      </span>

      <h2>Ubicación</h2>

      <p className="orden-sanitaria__descripcion">
        {TEXTOS_ORDEN_SANITARIA.ubicacion.descripcion}
      </p>

      <PanelIndicaciones
        textos={
          TEXTOS_ORDEN_SANITARIA.ubicacion
            .indicaciones ?? []
        }
      />

      <div className="orden-sanitaria__grupo">
        <h3>Ubicación para notificar</h3>

        <div className="orden-sanitaria__fila orden-sanitaria__fila--3">
          <div className="orden-sanitaria__campo">
            <label htmlFor="provincia">
              Provincia *
            </label>

            <select
              id="provincia"
              value={datos.provincia}
              onChange={manejarCambio('provincia')}
            >
              <option value="">
                Seleccione una provincia
              </option>

              {provincias.map((provincia) => (
                <option
                  key={provincia.valor}
                  value={provincia.valor}
                >
                  {provincia.etiqueta}
                </option>
              ))}
            </select>

            {errores.provincia && (
              <p className="orden-sanitaria__error">
                {errores.provincia}
              </p>
            )}
          </div>

          <div className="orden-sanitaria__campo">
            <label htmlFor="canton">
              Cantón *
            </label>

            <select
              id="canton"
              value={datos.canton}
              onChange={manejarCambio('canton')}
              disabled={!datos.provincia}
            >
              <option value="">
                Seleccione un cantón
              </option>

              {cantones.map((canton) => (
                <option
                  key={canton.valor}
                  value={canton.valor}
                >
                  {canton.etiqueta}
                </option>
              ))}
            </select>

            {errores.canton && (
              <p className="orden-sanitaria__error">
                {errores.canton}
              </p>
            )}
          </div>

          <div className="orden-sanitaria__campo">
            <label htmlFor="distrito">
              Distrito *
            </label>

            <select
              id="distrito"
              value={datos.distrito}
              onChange={manejarCambio('distrito')}
              disabled={!datos.canton}
            >
              <option value="">
                Seleccione un distrito
              </option>

              {distritos.map((distrito) => (
                <option
                  key={distrito.valor}
                  value={distrito.valor}
                >
                  {distrito.etiqueta}
                </option>
              ))}
            </select>

            {errores.distrito && (
              <p className="orden-sanitaria__error">
                {errores.distrito}
              </p>
            )}
          </div>
        </div>

        <div className="orden-sanitaria__campo">
          <label htmlFor="direccionExacta">
            Dirección exacta para notificar *
          </label>

          <textarea
            id="direccionExacta"
            rows="4"
            value={datos.direccionExacta}
            onChange={manejarCambio('direccionExacta')}
          />

          {errores.direccionExacta && (
            <p className="orden-sanitaria__error">
              {errores.direccionExacta}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}