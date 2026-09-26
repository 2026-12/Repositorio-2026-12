export default function FilaOrdenanza({
  numero,
  datos,
  errores = {},
  puedeEliminar = false,
  onChange,
  onEliminar,
}) {
  const manejarCambio = (campo) => (event) => {
    onChange(campo, event.target.value);
  };

  return (
    <article className="orden-sanitaria__ordenanza">
      <div className="orden-sanitaria__ordenanza-cabecera">
        <h3>Ordenanza {numero}</h3>

        {puedeEliminar && (
          <button
            type="button"
            className="orden-sanitaria__ordenanza-eliminar"
            onClick={onEliminar}
            aria-label={`Eliminar ordenanza ${numero}`}
          >
            Eliminar
          </button>
        )}
      </div>

      <div className="orden-sanitaria__campo">
        <label htmlFor={`ordenanza-${numero}`}>
          Ordenanza *
        </label>

        <textarea
          id={`ordenanza-${numero}`}
          rows={5}
          value={datos.ordenanza}
          onChange={manejarCambio('ordenanza')}
        />

        {errores.ordenanza && (
          <p className="orden-sanitaria__error">
            {errores.ordenanza}
          </p>
        )}
      </div>

      <div className="orden-sanitaria__fila orden-sanitaria__fila--2">
        <div className="orden-sanitaria__campo">
          <label htmlFor={`fundamento-legal-${numero}`}>
            Fundamento legal *
          </label>

          <textarea
            id={`fundamento-legal-${numero}`}
            rows={4}
            value={datos.fundamentoLegal}
            onChange={manejarCambio('fundamentoLegal')}
          />

          {errores.fundamentoLegal && (
            <p className="orden-sanitaria__error">
              {errores.fundamentoLegal}
            </p>
          )}
        </div>

        <div className="orden-sanitaria__campo">
          <label htmlFor={`plazo-cumplimiento-${numero}`}>
            Plazo de cumplimiento *
          </label>

          <input
            id={`plazo-cumplimiento-${numero}`}
            type="text"
            value={datos.plazoCumplimiento}
            onChange={manejarCambio('plazoCumplimiento')}
          />

          {errores.plazoCumplimiento && (
            <p className="orden-sanitaria__error">
              {errores.plazoCumplimiento}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}