import { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './SeleccionEstablecimiento.css';

registerLocale('es', es);

const API_BASE_URL = 'https://localhost:7119';
const ID_GUIA = 1; // Guia de Inspeccion para Servicios de Alimentacion al Publico

// Tipos de establecimiento y secciones aplicables (Guía de Evaluación
// Sanitaria, Acuerdo 1803) — fuente: Excel del equipo.
const TIPOS_ESTABLECIMIENTO = [
  { id: 'con-express', idBackend: 1, nombre: 'Establecimiento con servicio Express', secciones: 'A-B-C-D-E-F-G', puntos: 210 },
  { id: 'sin-express', idBackend: 2, nombre: 'Establecimiento sin servicio Express', secciones: 'A-B-C-D-E-F', puntos: 199 },
  { id: 'catering', idBackend: 3, nombre: 'Servicios de Catering', secciones: 'A-B-C-D-E-H', puntos: 171 },
  { id: 'express', idBackend: 4, nombre: 'Servicio Express', secciones: 'A-B-C-D-E-G', puntos: 180 },
  { id: 'ventana', idBackend: 5, nombre: 'Ventana', secciones: 'A-B-C-D-E', puntos: 177 },
];

function generarConsecutivo() {
  // Prueba: en producción este número lo asigna el backend, no el frontend.
  const correlativo = String(Math.floor(Math.random() * 9000) + 1000);
  const anio = new Date().getFullYear();
  return `MS-DRRSCS-ARS-T-AI-${correlativo}-${anio}`;
}

function SeleccionEstablecimiento({ onComenzar }) {
  const [fecha, setFecha] = useState(null);
  const [nombre, setNombre] = useState('');
  const [tipoId, setTipoId] = useState(null);
  const [consecutivo, setConsecutivo] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState(null);

  const tipoSeleccionado = TIPOS_ESTABLECIMIENTO.find((t) => t.id === tipoId);
  const puedeComenzar =
    fecha !== null &&
    consecutivo.trim().length > 0 &&
    nombre.trim().length > 0 &&
    tipoSeleccionado;

  const manejarComenzar = async () => {
    if (!puedeComenzar || creando) return;
    setCreando(true);
    setErrorCreacion(null);
    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/inspecciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idGuia: ID_GUIA,
          idTipoEstablecimiento: tipoSeleccionado.idBackend,
          nombreEstablecimiento: nombre,
          consecutivo,
        }),
      });
      if (!respuesta.ok) {
        throw new Error('La API respondio con un error.');
      }
      const datosApi = await respuesta.json();
      onComenzar({
        idInspeccion: datosApi.idInspeccion,
        nombre,
        fecha: fecha.toLocaleDateString('es-CR'),
        consecutivo,
        tipoLabel: tipoSeleccionado.nombre,
        secciones: tipoSeleccionado.secciones,
      });
    } catch (err) {
      console.error('Error al crear la inspeccion:', err);
      setErrorCreacion('No se pudo crear la inspección. Verificá que el backend esté corriendo.');
    } finally {
      setCreando(false);
    }
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
        <div className="tipos-grid">
          {TIPOS_ESTABLECIMIENTO.map((tipo) => (
            <button
              type="button"
              key={tipo.id}
              className={`tipo-card ${tipoId === tipo.id ? 'tipo-card--activa' : ''}`}
              onClick={() => setTipoId(tipo.id)}
            >
              <div className="tipo-card__fila">
                <span className="tipo-card__nombre">{tipo.nombre}</span>
                <span className="chip chip--puntos">{tipo.puntos} pts</span>
              </div>
              <span className="tipo-card__secciones">Secciones: {tipo.secciones}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="boton boton--primario boton--ancho"
          disabled={!puedeComenzar || creando}
          onClick={manejarComenzar}
        >
          {creando ? 'Creando inspección…' : 'Comenzar inspección →'}
        </button>
        {!puedeComenzar && (
          <p className="ayuda-obligatorio">
            Completá la fecha, el consecutivo, el nombre del establecimiento y el tipo para poder comenzar.
          </p>
        )}
        {errorCreacion && (
          <p className="ayuda-obligatorio" style={{ color: 'var(--rojo, #B00020)' }}>{errorCreacion}</p>
        )}
      </main>
    </div>
  );
}

export default SeleccionEstablecimiento;