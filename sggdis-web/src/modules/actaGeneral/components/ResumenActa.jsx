import { useGuiasInspeccion } from '../hooks/useGuiasInspeccion';
import {
  APARTADOS_ACTA,
  CARGOS_RESPONSABLE,
  MOTIVOS_INSPECCION,
  ACCIONES_A_SEGUIR,
} from '../config/actaGeneral';

// Convierte una lista de códigos (selección múltiple) en sus etiquetas
// legibles, y agrega el texto de "Otro" si corresponde.
function etiquetasDe(catalogo, valores, textoOtro) {
  return valores
    .map((valor) => {
      const etiqueta = catalogo.find((opcion) => opcion.valor === valor)?.etiqueta ?? valor;
      return valor === 'OTRO' && textoOtro?.trim() ? `${etiqueta}: ${textoOtro.trim()}` : etiqueta;
    })
    .join(', ');
}

function textoSiNo(valor) {
  if (valor === true) return 'Sí';
  if (valor === false) return 'No';
  return '';
}

// Un dato de la vista general. Los opcionales que quedaron vacíos se
// muestran con un guion para que se note que no se llenaron.
function Dato({ etiqueta, valor }) {
  const texto = typeof valor === 'string' ? valor.trim() : valor;
  return (
    <div className="acta-resumen__dato">
      <dt>{etiqueta}</dt>
      <dd>{texto || '—'}</dd>
    </div>
  );
}

// Vista general del Acta (después de "Finalizar"): muestra en solo lectura
// todo lo que se llenó en los seis apartados, para que el inspector lo
// revise antes de enviarlo. Cada apartado tiene un botón "Editar" que
// vuelve al formulario en ese apartado (deshabilitado una vez enviada).
function ResumenActa({
  infoGeneral,
  responsable,
  motivo,
  hallazgos,
  acciones,
  cierre,
  bloqueado,
  onEditarApartado,
}) {
  const { guias } = useGuiasInspeccion();

  const nombresGuias = hallazgos.idsGuias
    .map((idGuia) => guias.find((guia) => guia.idGuia === idGuia)?.nombre ?? `Guía ${idGuia}`)
    .join(', ');

  const contenidoPorApartado = {
    'info-general': (
      <>
        <Dato etiqueta="Fecha de inspección" valor={infoGeneral.fechaInspeccion} />
        <Dato etiqueta="Hora de inicio" valor={infoGeneral.horaInicio} />
        <Dato etiqueta="Número de expediente" valor={infoGeneral.numeroExpediente} />
        <Dato etiqueta="Número de denuncia" valor={infoGeneral.numeroDenuncia} />
        <Dato etiqueta="Nombre comercial" valor={infoGeneral.nombreComercial} />
        <Dato
          etiqueta="Ubicación"
          valor={[infoGeneral.provincia, infoGeneral.canton, infoGeneral.distrito].filter(Boolean).join(', ')}
        />
        <Dato etiqueta="Dirección exacta" valor={infoGeneral.direccionExacta} />
        <Dato etiqueta="Teléfono de contacto" valor={infoGeneral.telefonoContacto} />
        <Dato etiqueta="Correo para notificaciones" valor={infoGeneral.correoNotificaciones} />
        <Dato etiqueta="Autoriza el ingreso" valor={textoSiNo(infoGeneral.autorizaIngreso)} />
        <Dato etiqueta="Autoriza tomar fotografías" valor={textoSiNo(infoGeneral.autorizaFotos)} />
      </>
    ),
    responsable: (
      <>
        <Dato etiqueta="Nombre del responsable" valor={responsable.nombreResponsable} />
        <Dato
          etiqueta="Cargo"
          valor={etiquetasDe(CARGOS_RESPONSABLE, responsable.cargoResponsable, responsable.cargoResponsableOtro)}
        />
        <Dato etiqueta="Número de identificación" valor={responsable.numeroIdentificacionResponsable} />
      </>
    ),
    motivo: (
      <Dato
        etiqueta="Motivo de la inspección"
        valor={etiquetasDe(MOTIVOS_INSPECCION, motivo.motivoInspeccion, motivo.motivoInspeccionOtro)}
      />
    ),
    hallazgos: (
      <>
        <Dato etiqueta="Guías aplicables" valor={nombresGuias} />
        <Dato etiqueta="Hallazgos" valor={hallazgos.hallazgos} />
      </>
    ),
    acciones: (
      <>
        <Dato etiqueta="Acciones a seguir" valor={etiquetasDe(ACCIONES_A_SEGUIR, acciones.acciones, acciones.accionOtro)} />
        {acciones.acciones.includes('REPROGRAMACION') && (
          <Dato etiqueta="Motivo de la reprogramación" valor={acciones.motivoReprogramacion} />
        )}
      </>
    ),
    cierre: (
      <>
        {cierre.personasPresentes.map((persona, indice) => (
          <Dato
            key={persona.id}
            etiqueta={`Persona presente ${indice + 1}`}
            valor={[persona.nombreCompleto, persona.cargoInstitucion, persona.numeroIdentificacion, `Firma: ${persona.firma}`]
              .filter(Boolean)
              .join(' · ')}
          />
        ))}
      </>
    ),
  };

  return (
    <div className="acta-resumen">
      <p className="acta-apartado__etiqueta">Vista general</p>
      <h2 className="acta-apartado__titulo">Revisión del acta</h2>
      <p className="acta-apartado__descripcion">
        Revise la información de todos los apartados antes de enviar el acta. Una vez enviada, ya no se
        podrá modificar.
      </p>

      {APARTADOS_ACTA.map((apartado) => (
        <section key={apartado.id} className="acta-resumen__apartado">
          <div className="acta-resumen__cabecera">
            <h3>{apartado.etiqueta}</h3>
            <button
              type="button"
              className="acta-boton-lista"
              disabled={bloqueado}
              onClick={() => onEditarApartado(apartado.id)}
            >
              Editar
            </button>
          </div>
          <dl className="acta-resumen__datos">{contenidoPorApartado[apartado.id]}</dl>
        </section>
      ))}
    </div>
  );
}

export default ResumenActa;
