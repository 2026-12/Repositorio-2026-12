export default function DatosResponsable({ datos, errores = {}, onChange }) {
  return (
    <>
      <section className="orden-apartado">
        <h2>Datos del responsable</h2>
        <p>Complete la información de la persona funcionaria responsable de la emisión de la Orden Sanitaria.</p>
      </section>

      <section className="orden-grupo">
        <div className="orden-grupo__titulo">Persona funcionaria responsable</div>

        <div className="orden-grupo__contenido">
          <div className="orden-campo">
            <label htmlFor="responsableNombre">Nombre completo del director responsable </label>
            <input id="responsableNombre" type="text" value={datos.nombreCompleto} onChange={(e) => onChange('nombreCompleto', e.target.value)} />
            {errores.responsableNombre && <span className="orden-error">{errores.responsableNombre}</span>}
          </div>

          <div className="orden-grid-2">
            <div className="orden-campo">
              <label htmlFor="responsableCargo">Cargo del responsable </label>
              <input id="responsableCargo" type="text" value={datos.cargo} onChange={(e) => onChange('cargo', e.target.value)} />
              {errores.responsableCargo && <span className="orden-error">{errores.responsableCargo}</span>}
            </div>

            <div className="orden-campo">
              <label htmlFor="responsableArs">Nombre de la Unidad Organizativa o ARS </label>
              <input id="responsableArs" type="text" value={datos.unidadOrganizativaArs} onChange={(e) => onChange('unidadOrganizativaArs', e.target.value)} />
              {errores.responsableUnidad && <span className="orden-error">{errores.responsableUnidad}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="orden-grupo">
        <div className="orden-grupo__titulo">Firma del responsable</div>

        <div className="orden-grupo__contenido">
          <div className="orden-campo">
            <label htmlFor="firma">Firma</label>
            <input id="firma" type="text" value={datos.firma || ''} onChange={(e) => onChange('firma', e.target.value)} />
          </div>
        </div>
      </section>
    </>
  );
}