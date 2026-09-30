import { useEffect, useState } from 'react';
import { asignarAreaInspector, obtenerAreas, obtenerInspectores } from '../modules/auth/services/adminUsuariosService';
import './GestionInspectores.css';

export default function GestionInspectores({ onVolver }) {
  const [inspectores, setInspectores] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selecciones, setSelecciones] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    Promise.all([obtenerInspectores(), obtenerAreas()])
      .then(([usuarios, catalogo]) => {
        setInspectores(usuarios);
        setAreas(catalogo);
      })
      .catch((errorCarga) => setError(errorCarga.message))
      .finally(() => setCargando(false));
  }, []);

  async function guardarAsignacion(inspector) {
    const idArea = Number(selecciones[inspector.idUsuario] ?? inspector.idArea);
    if (!idArea) return;
    setGuardandoId(inspector.idUsuario);
    setError('');
    setMensaje('');
    try {
      await asignarAreaInspector(inspector.idUsuario, idArea);
      const area = areas.find((item) => item.idArea === idArea);
      setInspectores((actuales) => actuales.map((usuario) => usuario.idUsuario === inspector.idUsuario
        ? { ...usuario, ...area, idArea }
        : usuario));
      setSelecciones((actuales) => {
        const siguientes = { ...actuales };
        delete siguientes[inspector.idUsuario];
        return siguientes;
      });
      setMensaje(`Área asignada a ${inspector.correo}.`);
    } catch (errorGuardado) {
      setError(errorGuardado.message);
    } finally {
      setGuardandoId(null);
    }
  }

  return (
    <main className="gestion-inspectores">
      <header className="gestion-inspectores__header">
        <div>
          <p className="gestion-inspectores__eyebrow">ADMINISTRACIÓN</p>
          <h1>Asignación de áreas</h1>
          <p>Defina el área rectora en la que cada Inspector puede realizar inspecciones.</p>
        </div>
        <button className="gestion-inspectores__back" type="button" onClick={onVolver}>Volver al menú</button>
      </header>

      {error && <p className="gestion-inspectores__message gestion-inspectores__message--error" role="alert">{error}</p>}
      {mensaje && <p className="gestion-inspectores__message" role="status">{mensaje}</p>}
      {cargando ? <p className="gestion-inspectores__empty">Cargando datos…</p> : (
        <div className="gestion-inspectores__table-wrap">
          <table className="gestion-inspectores__table">
            <thead><tr><th>Inspector</th><th>Área rectora asignada</th><th>Acción</th></tr></thead>
            <tbody>
              {inspectores.map((inspector) => (
                <tr key={inspector.idUsuario}>
                  <td>
                    <span className="gestion-inspectores__email">{inspector.correo}</span>
                    <span className={`gestion-inspectores__status ${inspector.activo === 'S' ? '' : 'gestion-inspectores__status--inactive'}`}>
                      {inspector.activo === 'S' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <select
                      aria-label={`Área asignada a ${inspector.correo}`}
                      value={selecciones[inspector.idUsuario] ?? inspector.idArea ?? ''}
                      onChange={(event) => setSelecciones((actuales) => ({ ...actuales, [inspector.idUsuario]: event.target.value }))}
                    >
                      <option value="">Seleccione región y área</option>
                      {areas.map((area) => (
                        <option key={area.idArea} value={area.idArea}>{area.nombreRegion} / {area.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="gestion-inspectores__save"
                      disabled={!(selecciones[inspector.idUsuario] ?? inspector.idArea) || guardandoId === inspector.idUsuario}
                      onClick={() => guardarAsignacion(inspector)}
                    >
                      {guardandoId === inspector.idUsuario ? 'Guardando…' : 'Guardar'}
                    </button>
                  </td>
                </tr>
              ))}
              {inspectores.length === 0 && <tr><td colSpan="3" className="gestion-inspectores__empty">No hay inspectores registrados.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}