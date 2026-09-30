import { useEffect, useState } from 'react';
import {
  actualizarAsignacionUsuario,
  crearUsuarioAdministrador,
  obtenerAreas,
  obtenerUsuarios,
} from '../modules/auth/services/adminUsuariosService';
import './PanelAdministrador.css';

const ROLES = [
  'Inspector',
  'Director Regional',
  'Director de Área',
  'Atención al cliente',
  'Administrador',
];

function requiereArea(rol) {
  return rol !== 'Administrador';
}

export default function PanelAdministrador({ correoAdministrador, onCerrarSesion }) {
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cambios, setCambios] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rolNuevo, setRolNuevo] = useState('Inspector');
  const [areaNueva, setAreaNueva] = useState('');

  async function cargarDatos() {
    setCargando(true);
    setError('');
    try {
      const [listaUsuarios, listaAreas] = await Promise.all([obtenerUsuarios(), obtenerAreas()]);
      setUsuarios(listaUsuarios);
      setAreas(listaAreas);
    } catch (errorCarga) {
      setError(errorCarga.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    Promise.all([obtenerUsuarios(), obtenerAreas()])
      .then(([listaUsuarios, listaAreas]) => {
        setUsuarios(listaUsuarios);
        setAreas(listaAreas);
      })
      .catch((errorCarga) => setError(errorCarga.message))
      .finally(() => setCargando(false));
  }, []);

  async function crearUsuario(event) {
    event.preventDefault();
    setError('');
    setMensaje('');
    if (!correo.trim().toLowerCase().endsWith('@misalud.go.cr')) {
      setError('El correo debe terminar en @misalud.go.cr.');
      return;
    }
    if (contrasena.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (requiereArea(rolNuevo) && !areaNueva) {
      setError('Seleccione el área de trabajo del usuario.');
      return;
    }

    setGuardando(true);
    try {
      await crearUsuarioAdministrador({
        correo: correo.trim().toLowerCase(),
        contrasena,
        rol: rolNuevo,
        idArea: areaNueva || null,
      });
      setMensaje(`Usuario ${correo.trim().toLowerCase()} creado.`);
      setCorreo('');
      setContrasena('');
      setRolNuevo('Inspector');
      setAreaNueva('');
      await cargarDatos();
    } catch (errorCreacion) {
      setError(errorCreacion.message);
    } finally {
      setGuardando(false);
    }
  }

  function cambioUsuario(usuario, campo, valor) {
    setCambios((actuales) => ({
      ...actuales,
      [usuario.idUsuario]: {
        rol: actuales[usuario.idUsuario]?.rol ?? usuario.rol,
        idArea: actuales[usuario.idUsuario]?.idArea ?? usuario.idArea ?? '',
        [campo]: valor,
      },
    }));
  }

  async function guardarAsignacion(usuario) {
    const asignacionActual = cambios[usuario.idUsuario] ?? { rol: usuario.rol, idArea: usuario.idArea ?? '' };
    const asignacion = {
      ...asignacionActual,
      idArea: requiereArea(asignacionActual.rol) ? Number(asignacionActual.idArea) : null,
    };
    if (requiereArea(asignacion.rol) && !asignacion.idArea) {
      setError('Los roles operativos requieren un área asignada.');
      return;
    }
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      await actualizarAsignacionUsuario(usuario.idUsuario, asignacion.rol, asignacion.idArea);
      setCambios((actuales) => {
        const siguientes = { ...actuales };
        delete siguientes[usuario.idUsuario];
        return siguientes;
      });
      setMensaje(`Asignaciones de ${usuario.correo} actualizadas.`);
      await cargarDatos();
    } catch (errorActualizacion) {
      setError(errorActualizacion.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="panel-admin">
      <header className="panel-admin__header">
        <div>
          <p className="panel-admin__eyebrow">SGGDIS · ADMINISTRACIÓN</p>
          <h1>Panel de administración</h1>
          <p className="panel-admin__identity">Sesión: {correoAdministrador}</p>
        </div>
        <button className="panel-admin__logout" type="button" onClick={onCerrarSesion}>Cerrar sesión</button>
      </header>

      {error && <p className="panel-admin__notice panel-admin__notice--error" role="alert">{error}</p>}
      {mensaje && <p className="panel-admin__notice" role="status">{mensaje}</p>}

      <section className="panel-admin__section" aria-labelledby="crear-usuario-titulo">
        <div className="panel-admin__section-heading">
          <div>
            <h2 id="crear-usuario-titulo">Registrar usuario</h2>
            <p>Cree la cuenta y defina su rol y área de trabajo.</p>
          </div>
        </div>
        <form className="panel-admin__form" onSubmit={crearUsuario}>
          <label>
            <span>Correo institucional</span>
            <input type="email" autoComplete="email" placeholder="nombre@misalud.go.cr" value={correo} onChange={(event) => setCorreo(event.target.value)} required />
          </label>
          <label>
            <span>Contraseña inicial</span>
            <input type="password" autoComplete="new-password" minLength={12} value={contrasena} onChange={(event) => setContrasena(event.target.value)} required />
          </label>
          <label>
            <span>Rol</span>
            <select value={rolNuevo} onChange={(event) => { setRolNuevo(event.target.value); if (event.target.value === 'Administrador') setAreaNueva(''); }}>
              {ROLES.map((rol) => <option key={rol} value={rol}>{rol}</option>)}
            </select>
          </label>
          <label>
            <span>Área de trabajo{requiereArea(rolNuevo) ? ' *' : ''}</span>
            <select value={areaNueva} onChange={(event) => setAreaNueva(event.target.value)} disabled={!requiereArea(rolNuevo)} required={requiereArea(rolNuevo)}>
              <option value="">{requiereArea(rolNuevo) ? 'Seleccione región / área' : 'No aplica'}</option>
              {areas.map((area) => <option key={area.idArea} value={area.idArea}>{area.nombreRegion} / {area.nombre}</option>)}
            </select>
          </label>
          <button className="panel-admin__primary" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Crear usuario'}</button>
        </form>
      </section>

      <section className="panel-admin__section" aria-labelledby="usuarios-titulo">
        <div className="panel-admin__section-heading">
          <div>
            <h2 id="usuarios-titulo">Usuarios y asignaciones</h2>
            <p>Actualice el rol o el área asignada. Los cambios aplican al próximo inicio de sesión.</p>
          </div>
          <button className="panel-admin__refresh" type="button" onClick={cargarDatos} disabled={cargando}>Actualizar</button>
        </div>
        {cargando ? <p className="panel-admin__empty">Cargando usuarios…</p> : (
          <div className="panel-admin__table-wrap">
            <table className="panel-admin__table">
              <thead><tr><th>Correo</th><th>Rol</th><th>Área</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {usuarios.map((usuario) => {
                  const valores = cambios[usuario.idUsuario] ?? { rol: usuario.rol, idArea: usuario.idArea ?? '' };
                  return (
                    <tr key={usuario.idUsuario}>
                      <td>{usuario.correo}</td>
                      <td><select aria-label={`Rol de ${usuario.correo}`} value={valores.rol} onChange={(event) => cambioUsuario(usuario, 'rol', event.target.value)}>{ROLES.map((rol) => <option key={rol} value={rol}>{rol}</option>)}</select></td>
                      <td><select aria-label={`Área de ${usuario.correo}`} value={valores.idArea} disabled={!requiereArea(valores.rol)} onChange={(event) => cambioUsuario(usuario, 'idArea', event.target.value)}><option value="">{requiereArea(valores.rol) ? 'Seleccione área' : 'No aplica'}</option>{areas.map((area) => <option key={area.idArea} value={area.idArea}>{area.nombreRegion} / {area.nombre}</option>)}</select></td>
                      <td>{usuario.activo === 'S' ? 'Activo' : 'Inactivo'}</td>
                      <td><button className="panel-admin__save" type="button" disabled={guardando || (requiereArea(valores.rol) && !valores.idArea)} onClick={() => guardarAsignacion(usuario)}>Guardar</button></td>
                    </tr>
                  );
                })}
                {usuarios.length === 0 && <tr><td className="panel-admin__empty" colSpan="5">No hay usuarios registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}