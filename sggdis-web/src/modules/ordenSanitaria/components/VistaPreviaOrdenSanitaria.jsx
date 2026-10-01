function formatearFecha(fecha) {
  if (!fecha) {
    return 'No indicado';
  }

  const [anio, mes, dia] =
    fecha.split('-');

  return `${dia}/${mes}/${anio}`;
}

function obtenerFechaCumplimiento(plazo) {
  if (
    !plazo?.diaCumplimiento ||
    !plazo?.mesCumplimiento ||
    !plazo?.anioCumplimiento
  ) {
    return 'No indicado';
  }

  return (
    `${String(plazo.diaCumplimiento).padStart(2, '0')}/` +
    `${String(plazo.mesCumplimiento).padStart(2, '0')}/` +
    `${plazo.anioCumplimiento}`
  );
}

function obtenerPlazoTexto(plazo) {
  if (!plazo) {
    return 'No indicado';
  }

  switch (plazo.tipoPlazo) {
    case 'DIAS':
      return `${plazo.cantidad} ${
        Number(plazo.cantidad) === 1
          ? 'día'
          : 'días'
      }`;

    case 'MESES':
      return `${plazo.cantidad} ${
        Number(plazo.cantidad) === 1
          ? 'mes'
          : 'meses'
      }`;

    case 'HORAS':
      return `${plazo.cantidad} ${
        Number(plazo.cantidad) === 1
          ? 'hora'
          : 'horas'
      }`;

    case 'FECHA': {
      const fecha =
        obtenerFechaCumplimiento(plazo);

      if (plazo.horaCumplimiento) {
        return `${fecha} - ${plazo.horaCumplimiento}`;
      }

      return fecha;
    }

    default:
      return 'No indicado';
  }
}

function CampoVistaPrevia({
  etiqueta,
  valor,
  anchoCompleto = false,
}) {
  return (
    <div
      className={[
        'orden-vista-previa__dato',

        anchoCompleto
          ? 'orden-vista-previa__dato--completo'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="orden-vista-previa__etiqueta">
        {etiqueta}
      </span>

      <span className="orden-vista-previa__valor">
        {valor || 'No indicado'}
      </span>
    </div>
  );
}

export default function VistaPreviaOrdenSanitaria({
  datos,
  provincias = [],
  cantones = [],
  distritos = [],
}) {
  const provincia =
    provincias.find(
      (item) =>
        String(item.idProvincia) ===
        String(
          datos.ubicacion.idProvincia
        )
    );

  const canton =
    cantones.find(
      (item) =>
        String(item.idCanton) ===
        String(
          datos.ubicacion.idCanton
        )
    );

  const distrito =
    distritos.find(
      (item) =>
        String(item.idDistrito) ===
        String(
          datos.ubicacion.idDistrito
        )
    );

  const condicion =
    datos.informacionGeneral.condicion === 'Otro'
      ? datos.informacionGeneral.otraCondicion
      : datos.informacionGeneral.condicion;

  return (
    <>
      <section className="orden-apartado">
        <h2>
          Vista previa
        </h2>

        <p>
          Revise cuidadosamente la información de la Orden Sanitaria antes de
          emitirla.
        </p>
      </section>

      <section className="orden-vista-previa">

        {/* ===================================================
            ENCABEZADO
        =================================================== */}

        <div className="orden-vista-previa__encabezado">
          <div>
            <h3>
              Orden Sanitaria
            </h3>

            <span>
              {
                datos.informacionGeneral
                  .nombreEstablecimiento
              }
            </span>
          </div>

          <strong>
            {
              datos.informacionGeneral
                .numeroConsecutivo
            }
          </strong>
        </div>

        {/* ===================================================
            INFORMACIÓN GENERAL
        =================================================== */}

        <section className="orden-vista-previa__seccion">

          <div className="orden-vista-previa__titulo">
            Información General
          </div>

          <div className="orden-vista-previa__grid orden-vista-previa__grid--general">

            <CampoVistaPrevia
              etiqueta="Número consecutivo"
              valor={
                datos.informacionGeneral
                  .numeroConsecutivo
              }
            />

            <CampoVistaPrevia
              etiqueta="Número de expediente"
              valor={
                datos.informacionGeneral
                  .numeroExpediente ||
                'No indicado'
              }
            />

            <CampoVistaPrevia
              etiqueta="Nombre completo de la persona a notificar"
              valor={
                datos.informacionGeneral
                  .nombreCompleto
              }
            />

            <CampoVistaPrevia
              etiqueta="Identificación"
              valor={
                datos.informacionGeneral
                  .identificacion
              }
            />

            <CampoVistaPrevia
              etiqueta="Condición"
              valor={condicion}
            />

            <CampoVistaPrevia
              etiqueta="Nombre del establecimiento"
              valor={
                datos.informacionGeneral
                  .nombreEstablecimiento
              }
            />

          </div>

        </section>

        {/* ===================================================
            UBICACIÓN
        =================================================== */}

        <section className="orden-vista-previa__seccion">

          <div className="orden-vista-previa__titulo">
            Ubicación
          </div>

          <div className="orden-vista-previa__grid orden-vista-previa__grid--ubicacion">

            <CampoVistaPrevia
              etiqueta="Provincia"
              valor={
                provincia?.nombre
              }
            />

            <CampoVistaPrevia
              etiqueta="Cantón"
              valor={
                canton?.nombre
              }
            />

            <CampoVistaPrevia
              etiqueta="Distrito"
              valor={
                distrito?.nombre
              }
            />

            <CampoVistaPrevia
              etiqueta="Dirección exacta para notificar"
              valor={
                datos.ubicacion
                  .direccionExacta
              }
              anchoCompleto
            />

          </div>

        </section>

        {/* ===================================================
            NOTIFICACIÓN
        =================================================== */}

        <section className="orden-vista-previa__seccion">

          <div className="orden-vista-previa__titulo">
            Notificación
          </div>

          <div className="orden-vista-previa__grid orden-vista-previa__grid--notificacion">

            <CampoVistaPrevia
              etiqueta="Fecha de emisión"
              valor={
                formatearFecha(
                  datos.notificacion
                    .fechaEmision
                )
              }
            />

            <CampoVistaPrevia
              etiqueta="Fecha de notificación"
              valor={
                formatearFecha(
                  datos.notificacion
                    .fechaNotificacion
                )
              }
            />

          </div>

        </section>

        {/* ===================================================
            ORDENANZAS
        =================================================== */}

        <section className="orden-vista-previa__seccion">

          <div className="orden-vista-previa__titulo">
            Ordenanzas
          </div>

          <div className="orden-vista-previa__ordenanzas">

            {datos.ordenanzas.map(
              (ordenanza, index) => (
                <div
                  key={index}
                  className="orden-vista-previa__ordenanza"
                >

                  <div className="orden-vista-previa__ordenanza-titulo">
                    Ordenanza {index + 1}
                  </div>

                  <div className="orden-vista-previa__grid orden-vista-previa__grid--ordenanza">

                    <CampoVistaPrevia
                      etiqueta="Ordenanza"
                      valor={
                        ordenanza.ordenanza
                      }
                      anchoCompleto
                    />

                    <CampoVistaPrevia
                      etiqueta="Fundamento legal"
                      valor={
                        ordenanza.fundamentoLegal
                      }
                      anchoCompleto
                    />

                    <CampoVistaPrevia
                      etiqueta="Plazo de cumplimiento"
                      valor={
                        obtenerPlazoTexto(
                          ordenanza.plazo
                        )
                      }
                    />

                  </div>

                </div>
              )
            )}

          </div>

        </section>

        {/* ===================================================
            RESPONSABLE
        =================================================== */}

        <section className="orden-vista-previa__seccion">

          <div className="orden-vista-previa__titulo">
            Responsable
          </div>

          <div className="orden-vista-previa__grid orden-vista-previa__grid--responsable">

            <CampoVistaPrevia
              etiqueta="Nombre completo del director responsable"
              valor={
                datos.responsable
                  .nombreCompleto
              }
            />

            <CampoVistaPrevia
              etiqueta="Cargo del responsable"
              valor={
                datos.responsable
                  .cargo
              }
            />

            <CampoVistaPrevia
              etiqueta="Nombre de la Unidad Organizativa o ARS"
              valor={
                datos.responsable
                  .unidadOrganizativaArs
              }
            />

            <CampoVistaPrevia
              etiqueta="Firma"
              valor={
                datos.responsable
                  .firma ||
                'No indicada'
              }
            />

          </div>

        </section>

      </section>
    </>
  );
}