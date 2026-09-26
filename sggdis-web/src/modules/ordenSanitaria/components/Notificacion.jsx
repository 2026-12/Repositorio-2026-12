import {
  TEXTOS_ORDEN_SANITARIA,
} from '../config/textosOrdenSanitaria';

import PanelIndicaciones
  from './comunes/PanelIndicaciones';

export default function Notificacion({
  datos,
  errores = {},
  onChange,
}) {
  const manejarCambio = (campo) => (event) => {
    onChange(campo, event.target.value);
  };

  return (
    <section className="orden-sanitaria__seccion">
      <span className="orden-sanitaria__adaptado">
        ORDEN SANITARIA
      </span>

      <h2>Notificación</h2>

      <p className="orden-sanitaria__descripcion">
        {
          TEXTOS_ORDEN_SANITARIA.notificacion
            .descripcion
        }
      </p>

      <PanelIndicaciones
        textos={
          TEXTOS_ORDEN_SANITARIA.notificacion
            .indicaciones ?? []
        }
      />

      <div className="orden-sanitaria__grupo">
        <h3>Fechas de la Orden Sanitaria</h3>

        <div className="orden-sanitaria__fila orden-sanitaria__fila--2">
          <div className="orden-sanitaria__campo">
            <label htmlFor="fechaEmision">
              Fecha de emisión *
            </label>

            <input
              id="fechaEmision"
              type="date"
              value={datos.fechaEmision}
              onChange={manejarCambio('fechaEmision')}
            />

            {errores.fechaEmision && (
              <p className="orden-sanitaria__error">
                {errores.fechaEmision}
              </p>
            )}
          </div>

          <div className="orden-sanitaria__campo">
            <label htmlFor="fechaNotificacion">
              Fecha de notificación *
            </label>

            <input
              id="fechaNotificacion"
              type="date"
              value={datos.fechaNotificacion}
              onChange={manejarCambio(
                'fechaNotificacion'
              )}
            />

            {errores.fechaNotificacion && (
              <p className="orden-sanitaria__error">
                {errores.fechaNotificacion}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}