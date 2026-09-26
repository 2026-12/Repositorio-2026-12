import {
  CONDICIONES_PERSONA_NOTIFICADA,
} from '../config/ordenSanitaria';

import {
  TEXTOS_ORDEN_SANITARIA,
} from '../config/textosOrdenSanitaria';

import PanelIndicaciones
  from './comunes/PanelIndicaciones';

export default function InformacionGeneral({
  datos,
  errores = {},
  onChange,
}) {
  const manejarCambio = (campo) => (event) => {
    onChange(campo, event.target.value);
  };

  const mostrarOtraCondicion =
    datos.condicionPersonaNotificar === 'Otro';

  return (
    <section className="orden-sanitaria__seccion">
      <span className="orden-sanitaria__adaptado">
        ORDEN SANITARIA
      </span>

      <h2>Información General</h2>

      <p className="orden-sanitaria__descripcion">
        {
          TEXTOS_ORDEN_SANITARIA.general
            .descripcion
        }
      </p>

      <PanelIndicaciones
        textos={
          TEXTOS_ORDEN_SANITARIA.general
            .indicaciones ?? []
        }
      />

      <div className="orden-sanitaria__grupo">
        <h3>Persona a notificar</h3>

        <div className="orden-sanitaria__campo">
          <label htmlFor="nombrePersonaNotificar">
            Nombre de la persona a notificar *
          </label>

          <input
            id="nombrePersonaNotificar"
            type="text"
            value={datos.nombrePersonaNotificar}
            onChange={manejarCambio(
              'nombrePersonaNotificar'
            )}
          />

          {errores.nombrePersonaNotificar && (
            <p className="orden-sanitaria__error">
              {errores.nombrePersonaNotificar}
            </p>
          )}
        </div>

        <div className="orden-sanitaria__fila orden-sanitaria__fila--2">
          <div className="orden-sanitaria__campo">
            <label htmlFor="condicionPersonaNotificar">
              En su condición de *
            </label>

            <select
              id="condicionPersonaNotificar"
              value={datos.condicionPersonaNotificar}
              onChange={manejarCambio(
                'condicionPersonaNotificar'
              )}
            >
              <option value="">
                Seleccione una condición
              </option>

              {CONDICIONES_PERSONA_NOTIFICADA.map(
                (condicion) => (
                  <option
                    key={condicion}
                    value={condicion}
                  >
                    {condicion}
                  </option>
                )
              )}
            </select>

            {errores.condicionPersonaNotificar && (
              <p className="orden-sanitaria__error">
                {errores.condicionPersonaNotificar}
              </p>
            )}
          </div>

          <div className="orden-sanitaria__campo">
            <label htmlFor="identificacion">
              Número de identificación *
            </label>

            <input
              id="identificacion"
              type="text"
              value={datos.identificacion}
              onChange={manejarCambio('identificacion')}
            />

            {errores.identificacion && (
              <p className="orden-sanitaria__error">
                {errores.identificacion}
              </p>
            )}
          </div>
        </div>

        {mostrarOtraCondicion && (
          <div className="orden-sanitaria__campo">
            <label htmlFor="otraCondicion">
              Especifique la condición *
            </label>

            <input
              id="otraCondicion"
              type="text"
              value={datos.otraCondicion}
              onChange={manejarCambio('otraCondicion')}
            />

            {errores.otraCondicion && (
              <p className="orden-sanitaria__error">
                {errores.otraCondicion}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="orden-sanitaria__grupo">
        <h3>
          Establecimiento / sitio / inmueble
        </h3>

        <div className="orden-sanitaria__fila orden-sanitaria__fila--2">
          <div className="orden-sanitaria__campo">
            <label htmlFor="nombreEstablecimiento">
              Nombre del establecimiento / sitio /
              inmueble *
            </label>

            <input
              id="nombreEstablecimiento"
              type="text"
              value={datos.nombreEstablecimiento}
              onChange={manejarCambio(
                'nombreEstablecimiento'
              )}
            />

            {errores.nombreEstablecimiento && (
              <p className="orden-sanitaria__error">
                {errores.nombreEstablecimiento}
              </p>
            )}
          </div>

          <div className="orden-sanitaria__campo">
            <label htmlFor="numeroExpediente">
              N.º de expediente
            </label>

            <input
              id="numeroExpediente"
              type="text"
              value={datos.numeroExpediente}
              onChange={manejarCambio(
                'numeroExpediente'
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}