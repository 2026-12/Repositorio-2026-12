import { useGuiasInspeccion } from '../hooks/useGuiasInspeccion';
import {
  CARGOS_RESPONSABLE,
  MOTIVOS_INSPECCION,
  ACCIONES_A_SEGUIR,
} from '../config/actaGeneral';

// De 2026-10-04 a 04/10/2026 (los inputs de fecha guardan año-mes-día).
function formatearFecha(fecha) {
  if (!fecha) return '';

  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

function formatearSiNo(valor) {
  if (valor === true) return 'Sí';
  if (valor === false) return 'No';
  return '';
}

// Convierte los códigos seleccionados (ej. ['ENCARGADO', 'OTRO']) en sus
// etiquetas legibles, en el orden del catálogo. Si "Otro" va acompañado de su
// texto libre, se muestra junto a la etiqueta: "Otro: texto".
function etiquetasSeleccionadas(valores, catalogo, textoOtro) {
  return catalogo
    .filter((opcion) => (valores ?? []).includes(opcion.valor))
    .map((opcion) =>
      opcion.valor === 'OTRO' && textoOtro?.trim()
        ? `${opcion.etiqueta}: ${textoOtro.trim()}`
        : opcion.etiqueta
    )
    .join(', ');
}

function Dato({ etiqueta, valor, anchoCompleto = false }) {
  return (
    <div className={`acta-vista-previa__dato ${anchoCompleto ? 'acta-vista-previa__dato--completo' : ''}`}>
      <span className="acta-vista-previa__etiqueta">{etiqueta}</span>
      <span className="acta-vista-previa__valor">{valor || 'No indicado'}</span>
    </div>
  );
}

function Seccion({ titulo, columnas = 2, children }) {
  return (
    <section className="acta-vista-previa__seccion">
      <div className="acta-vista-previa__titulo">{titulo}</div>
      <div className={`acta-vista-previa__grid acta-vista-previa__grid--${columnas}`}>{children}</div>
    </section>
  );
}

// Paso final del wizard: resumen de solo lectura de los seis apartados, para
// revisar toda el acta antes de darla por terminada (mismo estilo que la
// vista previa de Orden Sanitaria).
function VistaPreviaActaGeneral({
  numeroActa,
  infoGeneral,
  responsable,
  motivo,
  hallazgos,
  acciones,
  cierre,
}) {
  const { guias } = useGuiasInspeccion();

  const nombresGuias = (hallazgos.idsGuias ?? [])
    .map((idGuia) => guias.find((guia) => guia.idGuia === idGuia)?.nombre)
    .filter(Boolean)
    .join(', ');

  const personas = cierre.personasPresentes ?? [];

  return (
    <section className="acta-apartado">
      <p className="acta-apartado__etiqueta">Revisión final</p>

      <h2 className="acta-apartado__titulo">Vista previa</h2>

      <p className="acta-apartado__descripcion">
        Revise cuidadosamente la información del acta antes de darla por terminada. Si algo
        no es correcto, use "Anterior" o los apartados de arriba para corregirlo.
      </p>

      <div className="acta-vista-previa">
        <div className="acta-vista-previa__encabezado">
          <div>
            <h3>Acta de Inspección General</h3>
            <span>{infoGeneral.nombreComercial}</span>
          </div>

          <strong>{numeroActa}</strong>
        </div>

        <Seccion titulo="I. Información General del Inmueble" columnas={2}>
          <Dato etiqueta="Fecha de inspección" valor={formatearFecha(infoGeneral.fechaInspeccion)} />
          <Dato etiqueta="Hora de inicio" valor={infoGeneral.horaInicio} />
          <Dato etiqueta="N° de expediente" valor={infoGeneral.numeroExpediente} />
          <Dato etiqueta="N° de denuncia" valor={infoGeneral.numeroDenuncia} />
          <Dato
            etiqueta="Establecimiento / sitio / inmueble a inspeccionar"
            valor={infoGeneral.nombreComercial}
            anchoCompleto
          />
          <Dato etiqueta="Provincia" valor={infoGeneral.provincia} />
          <Dato etiqueta="Cantón" valor={infoGeneral.canton} />
          <Dato etiqueta="Distrito" valor={infoGeneral.distrito} />
          <Dato etiqueta="Dirección exacta" valor={infoGeneral.direccionExacta} anchoCompleto />
          <Dato etiqueta="Teléfono de contacto" valor={infoGeneral.telefonoContacto} />
          <Dato etiqueta="Correo para notificaciones" valor={infoGeneral.correoNotificaciones} />
          <Dato
            etiqueta="Se autoriza ingresar al establecimiento"
            valor={formatearSiNo(infoGeneral.autorizaIngreso)}
          />
          <Dato
            etiqueta="Se autoriza tomar fotografías y/o videos"
            valor={formatearSiNo(infoGeneral.autorizaFotos)}
          />
        </Seccion>

        <Seccion titulo="II. Responsable durante la Inspección" columnas={2}>
          <Dato etiqueta="Nombre de la persona responsable" valor={responsable.nombreResponsable} />
          <Dato
            etiqueta="Número de identificación"
            valor={responsable.numeroIdentificacionResponsable}
          />
          <Dato
            etiqueta="Cargo de la persona que atendió la inspección"
            valor={etiquetasSeleccionadas(
              responsable.cargoResponsable,
              CARGOS_RESPONSABLE,
              responsable.cargoResponsableOtro
            )}
            anchoCompleto
          />
        </Seccion>

        <Seccion titulo="III. Motivo de la Inspección" columnas={1}>
          <Dato
            etiqueta="Motivo"
            valor={etiquetasSeleccionadas(
              motivo.motivoInspeccion,
              MOTIVOS_INSPECCION,
              motivo.motivoInspeccionOtro
            )}
          />
        </Seccion>

        <Seccion titulo="IV. Hallazgos de la Inspección" columnas={1}>
          <Dato etiqueta="Guías aplicables" valor={nombresGuias} />
          <Dato etiqueta="Descripción de los hallazgos" valor={hallazgos.hallazgos} />
        </Seccion>

        <Seccion titulo="V. Acciones a Seguir" columnas={1}>
          <Dato
            etiqueta="Acciones a seguir"
            valor={etiquetasSeleccionadas(
              acciones.acciones,
              ACCIONES_A_SEGUIR,
              acciones.accionOtro
            )}
          />
          {(acciones.acciones ?? []).includes('REPROGRAMACION') && (
            <Dato etiqueta="Motivo de la reprogramación" valor={acciones.motivoReprogramacion} />
          )}
        </Seccion>

        <section className="acta-vista-previa__seccion">
          <div className="acta-vista-previa__titulo">VI. Cierre y Firmas</div>

          <div className="acta-vista-previa__grid acta-vista-previa__grid--1">
            <Dato etiqueta="Hora de inicio de la inspección" valor={infoGeneral.horaInicio} />
          </div>

          <div className="acta-vista-previa__personas">
            {personas.map((persona, indice) => (
              <div key={persona.id} className="acta-vista-previa__persona">
                <div className="acta-vista-previa__persona-titulo">
                  Persona presente {indice + 1}
                </div>

                <div className="acta-vista-previa__grid acta-vista-previa__grid--2">
                  <Dato etiqueta="Nombre completo" valor={persona.nombreCompleto} />
                  <Dato etiqueta="Cargo / Institución" valor={persona.cargoInstitucion} />
                  <Dato etiqueta="Número de identificación" valor={persona.numeroIdentificacion} />
                  <Dato etiqueta="Firma" valor={persona.firma} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default VistaPreviaActaGeneral;
