import {
  TEXTOS_ORDEN_SANITARIA,
} from '../../config/textosOrdenSanitaria';

import PanelIndicaciones
  from '../comunes/PanelIndicaciones';

import DatosResponsable
  from '../DatosResponsable';

import FilaOrdenanza
  from './FilaOrdenanza';

export default function Ordenanzas({
  ordenanzas,
  errores = {},
  responsable,
  erroresResponsable = {},
  onAgregar,
  onActualizar,
  onEliminar,
  onActualizarResponsable,
}) {
  const erroresPorOrdenanza = Array.isArray(
    errores.ordenanzas,
  )
    ? errores.ordenanzas
    : [];

  const errorGeneral =
    typeof errores.ordenanzas === 'string'
      ? errores.ordenanzas
      : null;

  const textos = TEXTOS_ORDEN_SANITARIA.ordenanzas;

  return (
    <section className="orden-sanitaria__seccion">
      <span className="orden-sanitaria__adaptado">
        ORDEN SANITARIA
      </span>

      <h2>{textos.titulo}</h2>

      <p className="orden-sanitaria__descripcion">
        {textos.descripcion}
      </p>

      <PanelIndicaciones
        textos={textos.indicaciones ?? []}
      />

      {errorGeneral && (
        <p className="orden-sanitaria__error">
          {errorGeneral}
        </p>
      )}

      <div className="orden-sanitaria__lista-ordenanzas">
        {ordenanzas.map((ordenanza, indice) => (
          <FilaOrdenanza
            key={indice}
            numero={indice + 1}
            datos={ordenanza}
            errores={erroresPorOrdenanza[indice] ?? {}}
            puedeEliminar={ordenanzas.length > 1}
            onChange={(campo, valor) =>
              onActualizar(indice, campo, valor)
            }
            onEliminar={() => onEliminar(indice)}
          />
        ))}
      </div>

      <button
        type="button"
        className="orden-sanitaria__agregar-ordenanza"
        onClick={onAgregar}
      >
        + Agregar ordenanza
      </button>

      <div className="orden-sanitaria__contenido-legal">
        <PanelIndicaciones
          titulo={
            textos.fundamentoLegalApercibimiento.titulo
          }
          textos={
            textos.fundamentoLegalApercibimiento.contenido
          }
          abiertoInicialmente={false}
        />

        <PanelIndicaciones
          titulo={textos.usoInterno.titulo}
          textos={textos.usoInterno.contenido}
          abiertoInicialmente={false}
        />

        <PanelIndicaciones
          titulo={textos.recurrencia.titulo}
          textos={textos.recurrencia.contenido}
          abiertoInicialmente={false}
        />
      </div>

      <DatosResponsable
        datos={responsable}
        errores={erroresResponsable}
        onChange={onActualizarResponsable}
      />
    </section>
  );
}