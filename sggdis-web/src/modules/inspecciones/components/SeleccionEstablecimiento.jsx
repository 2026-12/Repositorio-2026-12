import { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import { useTiposEstablecimiento } from '../hooks/useTiposEstablecimiento';
import { crearInspeccion } from '../services/inspeccionesService';
import { ID_GUIA_ACTIVA } from '../config/inspeccion';
import { REGIONES_SALUD } from '../config/regionesSalud';
import 'react-datepicker/dist/react-datepicker.css';
import './SeleccionEstablecimiento.css';
import mapaDorado from '../../../assets/mapa-dorado.png';

registerLocale('es', es);

// Obtiene la fecha y hora actual del dispositivo.
function obtenerFechaHoraActual() {
  const ahora = new Date();

  return {
    fecha: ahora,
    hora: `${String(ahora.getHours()).padStart(2, '0')}:${String(
      ahora.getMinutes()
    ).padStart(2, '0')}`,
  };
}

// Primera pantalla de una inspección nueva: fecha/hora, consecutivo, nombre
// y tipo de establecimiento. Al confirmar crea la inspección en el backend
// y arranca el wizard de secciones.
function SeleccionEstablecimiento({ onComenzar, onVolverInicio }) {
  const [fechaHoraInicial] = useState(() => obtenerFechaHoraActual());

  const fecha = fechaHoraInicial.fecha;
  const hora = fechaHoraInicial.hora;

  const [nombre, setNombre] = useState('');
  const [tipoId, setTipoId] = useState(null);

  const [regionCodigo, setRegionCodigo] = useState('');
  const [areaCodigo, setAreaCodigo] = useState('');

  // El consecutivo se compone de la región, el área rectora,
  // un número de 4 dígitos y el año actual.
  const [numeroConsecutivo, setNumeroConsecutivo] = useState('');

  const anioConsecutivo = String(new Date().getFullYear());

  const [creando, setCreando] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState(null);

  // Carga los tipos de establecimiento disponibles para la guía activa.
  const { tipos, cargando, error } =
    useTiposEstablecimiento(ID_GUIA_ACTIVA);

  const tipoSeleccionado = tipos.find(
    (tipo) => tipo.idTipoEstablecimiento === tipoId
  );

  const regionSeleccionada = REGIONES_SALUD.find(
    (region) => region.codigo === regionCodigo
  );

  const areaSeleccionada = regionSeleccionada?.areas.find(
    (area) => area.codigo === areaCodigo
  );

  // Folio completo con los prefijos institucionales fijos.
  const consecutivo =
    regionSeleccionada &&
    areaSeleccionada &&
    numeroConsecutivo.length === 4
      ? `MS-DRRS${regionSeleccionada.codigo}-ARS-${areaSeleccionada.codigo}-AI-${numeroConsecutivo}-${anioConsecutivo}`
      : '';

  // El botón "Comenzar inspección" solo se habilita si todos los campos
  // obligatorios están completos.
  const puedeComenzar =
    fecha !== null &&
    regionSeleccionada &&
    areaSeleccionada &&
    numeroConsecutivo.length === 4 &&
    nombre.trim().length > 0 &&
    tipoSeleccionado &&
    hora.trim().length > 0;

  // Crea la inspección en el backend y avisa al padre para que arranque el formulario.
  const manejarComenzar = async () => {
    if (!puedeComenzar) return;

    setCreando(true);
    setErrorCreacion(null);

    try {
      // Combina fecha y hora local del dispositivo en un DateTime.
      const anio = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');

      const fechaHoraInspeccion =
        `${anio}-${mes}-${dia}T${hora}:00`;

      const { idInspeccion } = await crearInspeccion({
        idGuia: ID_GUIA_ACTIVA,
        idTipoEstablecimiento:
          tipoSeleccionado.idTipoEstablecimiento,
        nombreEstablecimiento: nombre,
        consecutivo,
        fecha: fechaHoraInspeccion,
      });

      onComenzar({
        nombre,
        fecha: fecha.toLocaleDateString('es-CR'),
        hora,
        consecutivo,
        tipoLabel: tipoSeleccionado.nombre,
        idGuia: ID_GUIA_ACTIVA,
        idTipoEstablecimiento:
          tipoSeleccionado.idTipoEstablecimiento,
        puntajeMaximo:
          tipoSeleccionado.puntajeMaximo,
        secciones:
          tipoSeleccionado.secciones ?? [],
        idInspeccion,
      });
    } catch (error) {
      setErrorCreacion(error.message);
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="pagina-inicio">
      <header className="cabecera-simple">
        <div className="cabecera__marca">
          <div className="cabecera__logo cabecera__logo--imagen">
            <img
              src={mapaDorado}
              alt="Ministerio de Salud de Costa Rica"
            />
          </div>

          <div>
            <h1>
              Guía de Inspección — Servicios de Alimentación al Público
            </h1>

            <p>
              Ministerio de Salud de Costa Rica
            </p>
          </div>
        </div>

        <button
          type="button"
          className="boton-volver-menu"
          onClick={onVolverInicio}
        >
          ← Volver al menú
        </button>
      </header>

      <main className="tarjeta-inicio">
        <div className="tarjeta-inicio__mapa">
          <img
            src={mapaDorado}
            alt="Ministerio de Salud de Costa Rica"
          />
        </div>

        <p className="tarjeta-inicio__institucion">
          MINISTERIO DE SALUD · COSTA RICA
        </p>

        <h2>
          Nueva inspección: Servicios de Alimentación
        </h2>

        {(errorCreacion || error) && (
          <div
            className="alerta-error"
            role="alert"
          >
            <strong>
              No se pudo continuar
            </strong>

            <span>
              {errorCreacion || error}
            </span>
          </div>
        )}

        <div className="campo-fila">
          <div className="campo">
            <label htmlFor="fecha">
              Fecha de inspección *
            </label>

            <DatePicker
              id="fecha"
              selected={fecha}
              dateFormat="dd/MM/yyyy"
              locale="es"
              className="input-fecha"
              wrapperClassName="input-fecha-wrapper"
              readOnly
            />
          </div>

          <div className="campo">
            <label htmlFor="hora">
              Hora de inspección *
            </label>

            <input
              id="hora"
              type="time"
              value={hora}
              className="input-hora"
              readOnly
            />
          </div>
        </div>

        <div className="campo-fila">
          <div className="campo">
            <label htmlFor="region">
              Dirección Regional *
            </label>

            <select
              id="region"
              value={regionCodigo}
              onChange={(e) => {
                setRegionCodigo(e.target.value);
                setAreaCodigo('');
              }}
            >
              <option value="">
                Seleccione una región
              </option>

              {REGIONES_SALUD.map((region) => (
                <option
                  key={region.codigo}
                  value={region.codigo}
                >
                  {region.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="area">
              Área Rectora de Salud *
            </label>

            <select
              id="area"
              value={areaCodigo}
              onChange={(e) =>
                setAreaCodigo(e.target.value)
              }
              disabled={!regionSeleccionada}
            >
              <option value="">
                Seleccione un área rectora
              </option>

              {regionSeleccionada?.areas.map((area) => (
                <option
                  key={area.codigo}
                  value={area.codigo}
                >
                  {area.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="campo">
          <label htmlFor="numero-consecutivo">
            N° consecutivo *
          </label>

          <div className="consecutivo-campo">
            <span className="consecutivo-campo__prefijo">
              {regionSeleccionada && areaSeleccionada
                ? `MS-DRRS${regionSeleccionada.codigo}-ARS-${areaSeleccionada.codigo}-AI-`
                : 'MS-DRRS—-ARS-—-AI-'}
            </span>

            <input
              id="numero-consecutivo"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={numeroConsecutivo}
              onChange={(e) => {
                const valor =
                  e.target.value.replace(/\D/g, '');

                setNumeroConsecutivo(valor);
              }}
              placeholder="0000"
              className="consecutivo-campo__numero"
              aria-label="Número consecutivo"
            />

            <span className="consecutivo-campo__separador">
              -
            </span>

            <span className="consecutivo-campo__anio">
              {anioConsecutivo}
            </span>
          </div>
        </div>

        <div className="campo">
          <label htmlFor="nombre">
            Nombre del establecimiento *
          </label>

          <input
            id="nombre"
            type="text"
            placeholder="Ej. Soda El Agricultor"
            value={nombre}
            onChange={(e) =>
              setNombre(e.target.value)
            }
          />
        </div>

        <p className="campo-titulo">
          Seleccione el tipo de establecimiento *
        </p>

        {cargando && (
          <div
            className="tipos-grid tipos-grid--skeleton"
            aria-live="polite"
            aria-busy="true"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="tipo-card tipo-card--skeleton"
              >
                <div className="skeleton skeleton--tipoNombre"></div>
                <div className="skeleton skeleton--tipoLinea"></div>
                <div className="skeleton skeleton--tipoPuntos"></div>
              </div>
            ))}
          </div>
        )}

        {!cargando && !error && (
          <div className="tipos-grid">
            {tipos.map((tipo) => (
              <button
                type="button"
                key={tipo.idTipoEstablecimiento}
                className={`tipo-card ${
                  tipoId ===
                  tipo.idTipoEstablecimiento
                    ? 'tipo-card--activa'
                    : ''
                }`}
                onClick={() =>
                  setTipoId(
                    tipo.idTipoEstablecimiento
                  )
                }
              >
                <div className="tipo-card__fila">
                  <span className="tipo-card__nombre">
                    {tipo.nombre}
                  </span>

                  <span className="chip chip--puntos">
                    {tipo.puntajeMaximo} pts
                  </span>
                </div>

                <span className="tipo-card__secciones">
                  Secciones:{' '}
                  {tipo.secciones
                    .map((seccion) => seccion.codigo)
                    .join('-')}
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          className="boton boton--primario boton--ancho"
          disabled={
            !puedeComenzar || creando
          }
          onClick={manejarComenzar}
        >
          {creando
            ? 'Creando inspección…'
            : 'Comenzar inspección →'}
        </button>

        {!puedeComenzar && (
          <p className="ayuda-obligatorio">
            Completá la región, el área rectora, el consecutivo, el nombre del establecimiento y el tipo para poder comenzar.
          </p>
        )}
      </main>
    </div>
  );
}

export default SeleccionEstablecimiento;