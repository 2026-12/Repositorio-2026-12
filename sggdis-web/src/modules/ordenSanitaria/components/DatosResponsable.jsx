export default function DatosResponsable({
  datos,
  errores = {},
  onChange,
}) {
  const manejarCambio = (campo) => (event) => {
    onChange(campo, event.target.value);
  };

  return (
    <section className="orden-sanitaria__responsable">
      <h3>Datos del responsable</h3>

      <div className="orden-sanitaria__campo">
        <label htmlFor="responsable-nombre-completo">
          Nombre completo y firma del director responsable *
        </label>

        <input
          id="responsable-nombre-completo"
          type="text"
          value={datos.nombreCompleto}
          onChange={manejarCambio('nombreCompleto')}
        />

        {errores.nombreCompleto && (
          <p className="orden-sanitaria__error">
            {errores.nombreCompleto}
          </p>
        )}
      </div>

      <div className="orden-sanitaria__fila orden-sanitaria__fila--2">
        <div className="orden-sanitaria__campo">
          <label htmlFor="responsable-cargo">
            Cargo del responsable *
          </label>

          <input
            id="responsable-cargo"
            type="text"
            value={datos.cargo}
            onChange={manejarCambio('cargo')}
          />

          {errores.cargo && (
            <p className="orden-sanitaria__error">
              {errores.cargo}
            </p>
          )}
        </div>

        <div className="orden-sanitaria__campo">
          <label htmlFor="responsable-unidad">
            Nombre de la Unidad Organizativa o ARS *
          </label>

          <input
            id="responsable-unidad"
            type="text"
            value={datos.unidadOrganizativaArs}
            onChange={manejarCambio('unidadOrganizativaArs')}
          />

          {errores.unidadOrganizativaArs && (
            <p className="orden-sanitaria__error">
              {errores.unidadOrganizativaArs}
            </p>
          )}
        </div>
      </div>

      <div className="orden-sanitaria__campo">
        <label htmlFor="responsable-firma">
          Firma *
        </label>

        <input
          id="responsable-firma"
          type="text"
          value={datos.firma}
          onChange={manejarCambio('firma')}
        />

        {errores.firma && (
          <p className="orden-sanitaria__error">
            {errores.firma}
          </p>
        )}
      </div>
    </section>
  );
}