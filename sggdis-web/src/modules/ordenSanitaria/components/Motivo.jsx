export default function Motivo({ motivo, errores = {}, onChange }) {
  return (
    <>
      <section className="orden-apartado">
        <h2>Motivo</h2>
        <p>Describa los hechos comprobados que fundamentan la emisión de la Orden Sanitaria.</p>
      </section>

      <section className="orden-grupo">
        <div className="orden-grupo__titulo">Motivo de la Orden Sanitaria</div>

        <div className="orden-grupo__contenido">
          <div className="orden-campo">
            <label htmlFor="motivo">Motivo *</label>
            <textarea id="motivo" className="orden-textarea--grande" value={motivo} onChange={(e) => onChange(e.target.value)} />
            {errores.motivo && <span className="orden-error">{errores.motivo}</span>}
          </div>
        </div>
      </section>
    </>
  );
}