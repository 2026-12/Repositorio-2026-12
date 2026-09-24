import { PROVINCIAS_COSTA_RICA } from '../config/actaGeneral';

// Apartado I del wizard del Acta General (HU-006): datos de ubicación, fecha/
// hora y permisos de acceso para la inspección. Es un componente "tonto": todo
// el estado y el guardado vive en useActaGeneral, acá solo se pintan los campos.
function ApartadoInfoGeneral({ datos, errores, onCambiarCampo }) {
  const manejarCambio = (campo) => (evento) => {
    onCambiarCampo(campo, evento.target.value);
  };

  return (
    <section className="acta-apartado">
      <p className="acta-apartado__etiqueta">Apartado I</p>

      <h2 className="acta-apartado__titulo">Información General del Inmueble</h2>

      <p className="acta-apartado__descripcion">
        Ingrese la ubicación, datos temporales y permisos de acceso para la inspección actual.
      </p>

      <div className="acta-campo-fila">
        <div className="acta-campo">
          <label htmlFor="fechaInspeccion">Fecha de inspección *</label>
          <input
            id="fechaInspeccion"
            type="date"
            value={datos.fechaInspeccion}
            onChange={manejarCambio('fechaInspeccion')}
          />
          {errores.fechaInspeccion && (
            <span className="acta-campo__error">{errores.fechaInspeccion}</span>
          )}
        </div>

        <div className="acta-campo">
          <label htmlFor="horaInicio">Hora de inicio (Formato 24h) *</label>
          <input
            id="horaInicio"
            type="time"
            value={datos.horaInicio}
            onChange={manejarCambio('horaInicio')}
          />
          {errores.horaInicio && (
            <span className="acta-campo__error">{errores.horaInicio}</span>
          )}
        </div>
      </div>

      <div className="acta-campo-fila">
        <div className="acta-campo">
          <label htmlFor="numeroExpediente">N° de expediente</label>
          <input
            id="numeroExpediente"
            type="text"
            placeholder="Ej: EXP-2026-0892"
            value={datos.numeroExpediente}
            onChange={manejarCambio('numeroExpediente')}
          />
        </div>

        <div className="acta-campo">
          <label htmlFor="numeroDenuncia">N° Denuncia (Si aplica)</label>
          <input
            id="numeroDenuncia"
            type="text"
            placeholder="Ej: DEN-2026-0104"
            value={datos.numeroDenuncia}
            onChange={manejarCambio('numeroDenuncia')}
          />
        </div>
      </div>

      <div className="acta-campo">
        <label htmlFor="nombreComercial">Nombre del establecimiento / sitio / inmueble a inspeccionar *</label>
        <input
          id="nombreComercial"
          type="text"
          placeholder="Ej: Industria de Alimentos Central S.A."
          value={datos.nombreComercial}
          onChange={manejarCambio('nombreComercial')}
        />
        {errores.nombreComercial && (
          <span className="acta-campo__error">{errores.nombreComercial}</span>
        )}
      </div>

      <div className="acta-campo-fila acta-campo-fila--tres">
        <div className="acta-campo">
          <label htmlFor="provincia">Provincia *</label>
          <input
            id="provincia"
            list="acta-provincias"
            type="text"
            value={datos.provincia}
            onChange={manejarCambio('provincia')}
          />
          <datalist id="acta-provincias">
            {PROVINCIAS_COSTA_RICA.map((provincia) => (
              <option key={provincia} value={provincia} />
            ))}
          </datalist>
          {errores.provincia && <span className="acta-campo__error">{errores.provincia}</span>}
        </div>

        <div className="acta-campo">
          <label htmlFor="canton">Cantón *</label>
          <input id="canton" type="text" value={datos.canton} onChange={manejarCambio('canton')} />
          {errores.canton && <span className="acta-campo__error">{errores.canton}</span>}
        </div>

        <div className="acta-campo">
          <label htmlFor="distrito">Distrito *</label>
          <input
            id="distrito"
            type="text"
            value={datos.distrito}
            onChange={manejarCambio('distrito')}
          />
          {errores.distrito && <span className="acta-campo__error">{errores.distrito}</span>}
        </div>
      </div>

      <div className="acta-campo">
        <label htmlFor="direccionExacta">Dirección exacta *</label>
        <textarea
          id="direccionExacta"
          placeholder="Otras señas y referencia geográfica exacta..."
          value={datos.direccionExacta}
          onChange={manejarCambio('direccionExacta')}
        />
        {errores.direccionExacta && (
          <span className="acta-campo__error">{errores.direccionExacta}</span>
        )}
      </div>

      <div className="acta-campo-fila">
        <div className="acta-campo">
          <label htmlFor="telefonoContacto">Teléfono de contacto</label>
          <input
            id="telefonoContacto"
            type="tel"
            placeholder="Ej: 2550-0000"
            value={datos.telefonoContacto}
            onChange={manejarCambio('telefonoContacto')}
          />
        </div>

        <div className="acta-campo">
          <label htmlFor="correoNotificaciones">Correo electrónico para notificaciones *</label>
          <input
            id="correoNotificaciones"
            type="email"
            placeholder="notificaciones@empresa.com"
            value={datos.correoNotificaciones}
            onChange={manejarCambio('correoNotificaciones')}
          />
          {errores.correoNotificaciones && (
            <span className="acta-campo__error">{errores.correoNotificaciones}</span>
          )}
        </div>
      </div>

      <div className="acta-campo-fila">
        <div className="acta-campo">
          <span className="acta-campo__etiquetaGrupo">
            Se autoriza ingresar al establecimiento / sitio / inmueble a inspeccionar:
          </span>
          <div className="acta-opciones">
            <button
              type="button"
              className={`acta-opcion ${datos.autorizaIngreso ? 'acta-opcion--activa' : ''}`}
              onClick={() => onCambiarCampo('autorizaIngreso', true)}
            >
              Sí
            </button>
            <button
              type="button"
              className={`acta-opcion ${!datos.autorizaIngreso ? 'acta-opcion--activa' : ''}`}
              onClick={() => onCambiarCampo('autorizaIngreso', false)}
            >
              No
            </button>
          </div>
        </div>

        <div className="acta-campo">
          <span className="acta-campo__etiquetaGrupo">
            Se autoriza al funcionario de salud tomar fotografías y/o videos del establecimiento / sitio / inmueble a inspeccionar:
          </span>
          <div className="acta-opciones">
            <button
              type="button"
              className={`acta-opcion ${datos.autorizaFotos ? 'acta-opcion--activa' : ''}`}
              onClick={() => onCambiarCampo('autorizaFotos', true)}
            >
              Sí
            </button>
            <button
              type="button"
              className={`acta-opcion ${!datos.autorizaFotos ? 'acta-opcion--activa' : ''}`}
              onClick={() => onCambiarCampo('autorizaFotos', false)}
            >
              No
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ApartadoInfoGeneral;
