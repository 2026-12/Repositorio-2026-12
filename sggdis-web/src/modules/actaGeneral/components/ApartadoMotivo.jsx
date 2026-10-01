import { MOTIVOS_INSPECCION } from '../config/actaGeneral';

// Apartado III del wizard del Acta General (HU-008): motivo de la
// inspección. Igual que ApartadoResponsable, es un componente "tonto": el
// estado y el guardado viven en useActaGeneral.
function ApartadoMotivo({ datos, errores, onCambiarCampo }) {
  const manejarCambio = (campo) => (evento) => {
    onCambiarCampo(campo, evento.target.value);
  };

  // El motivo es de elección única, pero se puede deshacer (igual que el
  // cargo del Apartado II): volver a hacer clic en el ya elegido lo deja
  // sin marcar.
  const elegirMotivo = (valor) => {
    onCambiarCampo('motivoInspeccion', datos.motivoInspeccion === valor ? null : valor);
  };

  return (
    <section className="acta-apartado">
      <p className="acta-apartado__etiqueta">Apartado III</p>

      <h2 className="acta-apartado__titulo">Motivo de la Inspección</h2>

      <p className="acta-apartado__descripcion">
        Marque la opción que corresponda al motivo de esta inspección.
      </p>

      <div className="acta-campo">
        <span className="acta-campo__etiquetaGrupo">Motivo de la inspección *</span>
        <div className="acta-opciones acta-opciones--envolver">
          {MOTIVOS_INSPECCION.map((motivo) => (
            <button
              key={motivo.valor}
              type="button"
              className={`acta-opcion ${datos.motivoInspeccion === motivo.valor ? 'acta-opcion--activa' : ''}`}
              onClick={() => elegirMotivo(motivo.valor)}
            >
              {motivo.etiqueta}
            </button>
          ))}
        </div>
        {errores.motivoInspeccion && (
          <span className="acta-campo__error">{errores.motivoInspeccion}</span>
        )}
      </div>

      {datos.motivoInspeccion === 'OTRO' && (
        <div className="acta-campo">
          <label htmlFor="motivoInspeccionOtro">Especifique el motivo *</label>
          <input
            id="motivoInspeccionOtro"
            type="text"
            placeholder="Ej: Verificación de denuncia anónima"
            value={datos.motivoInspeccionOtro}
            onChange={manejarCambio('motivoInspeccionOtro')}
          />
          {errores.motivoInspeccionOtro && (
            <span className="acta-campo__error">{errores.motivoInspeccionOtro}</span>
          )}
        </div>
      )}
    </section>
  );
}

export default ApartadoMotivo;
