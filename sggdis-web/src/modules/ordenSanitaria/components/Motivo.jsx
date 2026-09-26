import { TEXTOS_ORDEN_SANITARIA,} from '../config/textosOrdenSanitaria';

import PanelIndicaciones from './comunes/PanelIndicaciones';

export default function Motivo({
  motivo,
  errores = {},
  onChange,
}) {
  const manejarCambio = (event) => {
    onChange(event.target.value);
  };

  return (
    <section className="orden-sanitaria__seccion">
      <span className="orden-sanitaria__adaptado">
        ORDEN SANITARIA
      </span>

      <h2>Motivo</h2>

      <p className="orden-sanitaria__descripcion">
        Describa los hechos comprobados que fundamentan
        la emisión de la Orden Sanitaria.
      </p>

      <PanelIndicaciones
        textos={
          TEXTOS_ORDEN_SANITARIA.motivo
            .indicaciones ?? []
        }
      />

      <div className="orden-sanitaria__grupo">
        <div className="orden-sanitaria__campo">
          <label htmlFor="motivo">
            Motivo *
          </label>

          <textarea
            id="motivo"
            rows="12"
            value={motivo}
            onChange={manejarCambio}
            placeholder="Ingrese el motivo de la Orden Sanitaria"
          />

          {errores.motivo && (
            <p className="orden-sanitaria__error">
              {errores.motivo}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}