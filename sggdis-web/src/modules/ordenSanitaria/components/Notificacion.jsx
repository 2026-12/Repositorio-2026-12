import { useRef } from 'react';

export default function Notificacion({
  datos,
  errores = {},
  onChange,
}) {
  const fechaEmisionRef =
    useRef(null);

  const fechaNotificacionRef =
    useRef(null);

  const obtenerFechaActual = () => {
    const fecha = new Date();

    const offset =
      fecha.getTimezoneOffset() *
      60000;

    return new Date(
      fecha.getTime() -
        offset
    )
      .toISOString()
      .slice(0, 10);
  };

  const fechaActual =
    obtenerFechaActual();

  const fechaMinimaNotificacion =
    datos.fechaEmision &&
    datos.fechaEmision >
      fechaActual
      ? datos.fechaEmision
      : fechaActual;

  const abrirCalendario = (
    referencia
  ) => {
    try {
      referencia.current
        ?.showPicker?.();
    } catch {
      // Selector nativo.
    }
  };

  const cambiarFechaEmision = (
    valor
  ) => {
    if (
      valor &&
      valor < fechaActual
    ) {
      return;
    }

    onChange(
      'fechaEmision',
      valor
    );
  };

  const cambiarFechaNotificacion =
    (valor) => {
      if (
        valor &&
        valor <
          fechaMinimaNotificacion
      ) {
        return;
      }

      onChange(
        'fechaNotificacion',
        valor
      );
    };

  return (
    <>
      <section className="orden-apartado">
        <h2>
          Notificación
        </h2>

        <p>
          Complete las fechas correspondientes a la emisión y
          notificación de la Orden Sanitaria.
        </p>
      </section>

      <section className="orden-grupo orden-grupo--notificacion">

        <div className="orden-grupo__titulo">
          Fechas de la Orden Sanitaria
        </div>

        <div className="orden-grupo__contenido">
          <div className="orden-grid-2">

            <div className="orden-campo">
              <label htmlFor="fechaEmision">
                Fecha de emisión
              </label>

              <input
                ref={
                  fechaEmisionRef
                }
                id="fechaEmision"
                type="date"
                min={
                  fechaActual
                }
                value={
                  datos
                    .fechaEmision ||
                  ''
                }
                onChange={(e) =>
                  cambiarFechaEmision(
                    e.target
                      .value
                  )
                }
                onClick={() =>
                  abrirCalendario(
                    fechaEmisionRef
                  )
                }
                onFocus={() =>
                  abrirCalendario(
                    fechaEmisionRef
                  )
                }
              />

              {errores.fechaEmision && (
                <span className="orden-error">
                  {
                    errores
                      .fechaEmision
                  }
                </span>
              )}
            </div>

            <div className="orden-campo">
              <label htmlFor="fechaNotificacion">
                Fecha de notificación
              </label>

              <input
                ref={
                  fechaNotificacionRef
                }
                id="fechaNotificacion"
                type="date"
                min={
                  fechaMinimaNotificacion
                }
                value={
                  datos
                    .fechaNotificacion ||
                  ''
                }
                onChange={(e) =>
                  cambiarFechaNotificacion(
                    e.target
                      .value
                  )
                }
                onClick={() =>
                  abrirCalendario(
                    fechaNotificacionRef
                  )
                }
                onFocus={() =>
                  abrirCalendario(
                    fechaNotificacionRef
                  )
                }
              />

              {errores.fechaNotificacion && (
                <span className="orden-error">
                  {
                    errores
                      .fechaNotificacion
                  }
                </span>
              )}
            </div>

          </div>
        </div>

      </section>
    </>
  );
}