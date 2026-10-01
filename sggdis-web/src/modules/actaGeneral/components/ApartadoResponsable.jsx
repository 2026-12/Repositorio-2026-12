import { CARGOS_RESPONSABLE } from '../config/actaGeneral';

// Apartado II del wizard del Acta General (HU-007): datos de la persona que
// atiende la inspección. Igual que ApartadoInfoGeneral, es un componente
// "tonto": el estado y el guardado viven en useActaGeneral.
function ApartadoResponsable({ datos, errores, onCambiarCampo }) {
  const manejarCambio = (campo) => (evento) => {
    onCambiarCampo(campo, evento.target.value);
  };

  // El cargo es de elección única, pero se puede deshacer (igual que los
  // botones Sí/No del Apartado I): volver a hacer clic en el ya elegido lo
  // deja sin marcar.
  const elegirCargo = (valor) => {
    onCambiarCampo('cargoResponsable', datos.cargoResponsable === valor ? null : valor);
  };

  return (
    <section className="acta-apartado">
      <p className="acta-apartado__etiqueta">Apartado II</p>

      <h2 className="acta-apartado__titulo">Información del Responsable durante la Inspección</h2>

      <p className="acta-apartado__descripcion">
        Indique los datos personales de la persona que atiende durante la inspección.
      </p>

      <div className="acta-campo">
        <label htmlFor="nombreResponsable">
          Nombre de la persona responsable de la atención durante la inspección *
        </label>
        <input
          id="nombreResponsable"
          type="text"
          placeholder="Ej: María Fernández Solano"
          value={datos.nombreResponsable}
          onChange={manejarCambio('nombreResponsable')}
        />
        {errores.nombreResponsable && (
          <span className="acta-campo__error">{errores.nombreResponsable}</span>
        )}
      </div>

      <div className="acta-campo">
        <span className="acta-campo__etiquetaGrupo">Cargo de la persona que atendió la inspección *</span>
        <div className="acta-opciones acta-opciones--envolver">
          {CARGOS_RESPONSABLE.map((cargo) => (
            <button
              key={cargo.valor}
              type="button"
              className={`acta-opcion ${datos.cargoResponsable === cargo.valor ? 'acta-opcion--activa' : ''}`}
              onClick={() => elegirCargo(cargo.valor)}
            >
              {cargo.etiqueta}
            </button>
          ))}
        </div>
        {errores.cargoResponsable && (
          <span className="acta-campo__error">{errores.cargoResponsable}</span>
        )}
      </div>

      {datos.cargoResponsable === 'OTRO' && (
        <div className="acta-campo">
          <label htmlFor="cargoResponsableOtro">Especifique el cargo *</label>
          <input
            id="cargoResponsableOtro"
            type="text"
            placeholder="Ej: Encargado de mantenimiento"
            value={datos.cargoResponsableOtro}
            onChange={manejarCambio('cargoResponsableOtro')}
          />
          {errores.cargoResponsableOtro && (
            <span className="acta-campo__error">{errores.cargoResponsableOtro}</span>
          )}
        </div>
      )}

      <div className="acta-campo">
        <label htmlFor="numeroIdentificacionResponsable">
          Número de identificación de la persona que atendió la inspección *
        </label>
        <input
          id="numeroIdentificacionResponsable"
          type="text"
          placeholder="Ej: 1-2345-6789"
          value={datos.numeroIdentificacionResponsable}
          onChange={manejarCambio('numeroIdentificacionResponsable')}
        />
        {errores.numeroIdentificacionResponsable && (
          <span className="acta-campo__error">{errores.numeroIdentificacionResponsable}</span>
        )}
      </div>
    </section>
  );
}

export default ApartadoResponsable;
