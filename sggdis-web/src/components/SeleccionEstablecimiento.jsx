import { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import { useTiposEstablecimiento } from '../hooks/useTiposEstablecimiento';
import { ID_GUIA_ACTIVA } from '../config/inspeccion';
import 'react-datepicker/dist/react-datepicker.css';
import './SeleccionEstablecimiento.css';

registerLocale('es', es);

function SeleccionEstablecimiento({ onComenzar }) {
  const [fecha, setFecha] = useState(null);
  const [nombre, setNombre] = useState('');
  const [tipoId, setTipoId] = useState(null);
  const [consecutivo, setConsecutivo] = useState('');
  const { tipos, cargando, error } = useTiposEstablecimiento(ID_GUIA_ACTIVA);

  const tipoSeleccionado = tipos.find((tipo) => tipo.idTipoEstablecimiento === tipoId);
  const puedeComenzar =
    fecha !== null &&
    consecutivo.trim().length > 0 &&
    nombre.trim().length > 0 &&
    tipoSeleccionado;

  const manejarComenzar = () => {
    if (!puedeComenzar) return;
    onComenzar({
      nombre,
      fecha: fecha.toLocaleDateString('es-CR'),
      consecutivo,
      tipoLabel: tipoSeleccionado.nombre,
      idGuia: ID_GUIA_ACTIVA,
      idTipoEstablecimiento: tipoSeleccionado.idTipoEstablecimiento,
      secciones: tipoSeleccionado.secciones ?? [],
    });
  };

  return (
    <div className="pagina-inicio">
      <header className="cabecera-simple">
        <div className="cabecera__marca">
          <div className="cabecera__logo">MS</div>
          <div>
            <h1>Guía de Inspección — Servicios de Alimentación al Público</h1>
            <p>Ministerio de Salud de Costa Rica</p>
          </div>
        </div>
      </header>

      <main className="tarjeta-inicio">
        <div className="tarjeta-inicio__logo">MS</div>
        <p className="tarjeta-inicio__institucion">MINISTERIO DE SALUD · COSTA RICA</p>
        <h2>Nueva inspección: Servicios de Alimentación</h2>

        <div className="campo-fila">
          <div className="campo">
            <label htmlFor="fecha">Fecha de inspección *</label>
            <DatePicker
              id="fecha"
              selected={fecha}
              onChange={(date) => setFecha(date)}
              dateFormat="dd/MM/yyyy"
              locale="es"
              placeholderText="Seleccioná una fecha"
              className="input-fecha"
              wrapperClassName="input-fecha-wrapper"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              yearDropdownItemNumber={15}
              scrollableYearDropdown
            />
          </div>
          <div className="campo">
            <label htmlFor="consecutivo">N° consecutivo *</label>
            <input
              id="consecutivo"
              type="text"
              value={consecutivo}
              onChange={(e) => setConsecutivo(e.target.value)}
              placeholder="Ej. MS-DRRSCS-ARS-T-AI-0000-2026"
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="nombre">Nombre del establecimiento *</label>
          <input
            id="nombre"
            type="text"
            placeholder="Ej. Soda El Agricultor"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <p className="campo-titulo">Seleccione el tipo de establecimiento *</p>
        {cargando && <p className="ayuda-obligatorio">Cargando tipos de establecimiento...</p>}
        {error && <p className="ayuda-obligatorio">{error}</p>}
        {!cargando && !error && <div className="tipos-grid">
          {tipos.map((tipo) => (
            <button
              type="button"
              key={tipo.idTipoEstablecimiento}
              className={`tipo-card ${tipoId === tipo.idTipoEstablecimiento ? 'tipo-card--activa' : ''}`}
              onClick={() => setTipoId(tipo.idTipoEstablecimiento)}
            >
              <div className="tipo-card__fila">
                <span className="tipo-card__nombre">{tipo.nombre}</span>
                <span className="chip chip--puntos">{tipo.puntajeMaximo} pts</span>
              </div>
              <span className="tipo-card__secciones">Secciones: {tipo.secciones.map((seccion) => seccion.codigo).filter((codigo) => codigo !== 'H').join('-')}</span>
            </button>
          ))}
        </div>}

        <button
          type="button"
          className="boton boton--primario boton--ancho"
          disabled={!puedeComenzar}
          onClick={manejarComenzar}
        >
          Comenzar inspección →
        </button>
        {!puedeComenzar && (
          <p className="ayuda-obligatorio">
            Completá la fecha, el consecutivo, el nombre del establecimiento y el tipo para poder comenzar.
          </p>
        )}
      </main>
    </div>
  );
}

export default SeleccionEstablecimiento;