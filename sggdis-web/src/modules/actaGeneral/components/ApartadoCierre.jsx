import { clavePersona } from '../domain/validacionCierre';
import { limpiarSoloNumeros } from '../domain/validacionInfoGeneral';
import {
  LONGITUD_MAXIMA_NOMBRE_PERSONA,
  LONGITUD_MAXIMA_CARGO_INSTITUCION,
  LONGITUD_MAXIMA_IDENTIFICACION_PERSONA,
  LONGITUD_MAXIMA_FIRMA,
} from '../config/actaGeneral';

// Campos de cada persona presente, en el orden en que se muestran (de a dos
// por fila, igual que los demás apartados).
const CAMPOS_PERSONA = [
  {
    campo: 'nombreCompleto',
    etiqueta: 'Nombre completo *',
    placeholder: 'Ej: María Fernández Solano',
    longitudMaxima: LONGITUD_MAXIMA_NOMBRE_PERSONA,
  },
  {
    campo: 'cargoInstitucion',
    etiqueta: 'Cargo / Institución *',
    placeholder: 'Ej: Encargada del local',
    longitudMaxima: LONGITUD_MAXIMA_CARGO_INSTITUCION,
  },
  {
    campo: 'numeroIdentificacion',
    etiqueta: 'Número de identificación *',
    placeholder: 'Ej: 112345678',
    longitudMaxima: LONGITUD_MAXIMA_IDENTIFICACION_PERSONA,
    // Solo dígitos, igual que la identificación del Apartado II.
    soloNumeros: true,
  },
  {
    campo: 'firma',
    etiqueta: 'Firma *',
    placeholder: 'Escriba la firma de la persona',
    longitudMaxima: LONGITUD_MAXIMA_FIRMA,
  },
];

// Apartado VI del wizard del Acta General (HU-011): cierre de la
// inspección. Igual que los demás apartados, es un componente "tonto": la
// lista de personas, su guardado y sus errores viven en useActaGeneral.
function ApartadoCierre({
  horaInicio,
  datos,
  errores,
  onAgregarPersona,
  onEliminarPersona,
  onCambiarPersona,
}) {
  const personas = datos.personasPresentes;

  return (
    <section className="acta-apartado">
      <p className="acta-apartado__etiqueta">Apartado VI</p>

      <h2 className="acta-apartado__titulo">Cierre de la Inspección</h2>

      <p className="acta-apartado__descripcion">
        Registre a las personas presentes durante la inspección.
      </p>

      {/* Misma hora del Apartado I (registrada por el sistema al abrir el
          acta). Se muestra como texto y no como <input type="time"> para
          que siempre se vea en formato 24h, sin depender del idioma del
          dispositivo. */}
      <div className="acta-campo-fila">
        <div className="acta-campo">
          <label htmlFor="horaInicioCierre">Hora de inicio de la inspección (Formato 24h)</label>
          <input
            id="horaInicioCierre"
            type="text"
            value={horaInicio}
            readOnly
            className="acta-campo--soloLectura"
          />
        </div>
      </div>

      <div className="acta-campo">
        <span className="acta-campo__etiquetaGrupo">Personas presentes durante la inspección *</span>

        {personas.length === 0 && (
          <span className="acta-personas__vacio">No se han agregado personas presentes.</span>
        )}

        {personas.map((persona, indice) => (
          <div key={persona.id} className="acta-persona">
            <div className="acta-persona__cabecera">
              <span className="acta-persona__titulo">Persona {indice + 1}</span>
              <button
                type="button"
                className="acta-boton-lista acta-boton-lista--eliminar"
                onClick={() => onEliminarPersona(persona.id)}
              >
                Eliminar
              </button>
            </div>

            <div className="acta-campo-fila">
              {CAMPOS_PERSONA.map(({ campo, etiqueta, placeholder, longitudMaxima, soloNumeros }) => {
                const clave = clavePersona(persona.id, campo);

                return (
                  <div key={campo} className="acta-campo">
                    <label htmlFor={clave}>{etiqueta}</label>
                    <input
                      id={clave}
                      type="text"
                      inputMode={soloNumeros ? 'numeric' : undefined}
                      maxLength={longitudMaxima}
                      placeholder={placeholder}
                      value={persona[campo]}
                      onChange={(evento) => {
                        const valor = soloNumeros ? limpiarSoloNumeros(evento.target.value) : evento.target.value;
                        onCambiarPersona(persona.id, campo, valor);
                      }}
                    />
                    {errores[clave] && (
                      <span className="acta-campo__error">{errores[clave]}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="acta-boton-lista"
          data-campo="personasPresentes"
          onClick={onAgregarPersona}
        >
          ＋ Agregar persona
        </button>

        {errores.personasPresentes && (
          <span className="acta-campo__error">{errores.personasPresentes}</span>
        )}
      </div>
    </section>
  );
}

export default ApartadoCierre;
