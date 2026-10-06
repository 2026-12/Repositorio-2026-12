import { useEffect, useState } from 'react';
import {
  actualizarAsignacionUsuario,
  obtenerAreas,
  obtenerRegiones,
  obtenerUsuarios,
} from '../services/administracionService';
import './PanelAdministrador.css';

const ROLES = [
  'Inspector',
  'Director Regional',
  'Director de Área',
  'Atención al cliente',
  'Administrador',
];

function requiereRegion(rol) {
  return rol !== 'Administrador' && rol !== 'Pendiente';
}

function requiereArea(rol) {
  return rol !== 'Administrador' && rol !== 'Pendiente' && rol !== 'Director Regional';
}

export default function PanelAdministrador({ correoAdministrador, onMenuPrincipal, onCerrarSesion }) {
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [cambios, setCambios] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  async function cargarDatos() {
    setCargando(true);
    setError('');
    try {
      const [listaUsuarios, listaAreas, listaRegiones] = await Promise.all([obtenerUsuarios(), obtenerAreas(), obtenerRegiones()]);
      setUsuarios(listaUsuarios);
      setAreas(listaAreas);
      setRegiones(listaRegiones);
    } catch (errorCarga) {
      setError(errorCarga.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    Promise.all([obtenerUsuarios(), obtenerAreas(), obtenerRegiones()])
      .then(([listaUsuarios, listaAreas, listaRegiones]) => {
        setUsuarios(listaUsuarios);
        setAreas(listaAreas);
        setRegiones(listaRegiones);
      })
      .catch((errorCarga) => setError(errorCarga.message))
      .finally(() => setCargando(false));
  }, []);

  function cambioUsuario(usuario, campo, valor) {
    setCambios((actuales) => {
      const actual = actuales[usuario.idUsuario] ?? {
        rol: usuario.rol,
        idRegion: usuario.idRegion ?? '',
        idArea: usuario.idArea ?? '',
        idRegiones: usuario.idRegiones ?? (usuario.idRegion ? [usuario.idRegion] : []),
        idAreas: usuario.idAreas ?? (usuario.idArea ? [usuario.idArea] : []),
      };
      const siguiente = { ...actual, [campo]: valor };
      if (campo === 'idRegion') siguiente.idArea = '';
      if (campo === 'rol') {
        if (valor === 'Administrador') {
          siguiente.idRegion = '';
          siguiente.idArea = '';
        } else if (valor === 'Director Regional') {
          // Director Regional solo tiene región, sin área
          siguiente.idArea = '';
        }
      }
      return { ...actuales, [usuario.idUsuario]: siguiente };
    });
  }

  function cambioUbicacionInspector(usuario, campo, id, seleccionado) {
    setCambios((actuales) => {
      const actual = actuales[usuario.idUsuario] ?? {
        rol: usuario.rol,
        idRegion: usuario.idRegion ?? '',
        idArea: usuario.idArea ?? '',
        idRegiones: usuario.idRegiones ?? (usuario.idRegion ? [usuario.idRegion] : []),
        idAreas: usuario.idAreas ?? (usuario.idArea ? [usuario.idArea] : []),
      };
      const ids = new Set(actual[campo].map(String));
      if (seleccionado) ids.add(String(id));
      else ids.delete(String(id));
        const siguiente = { ...actual, [campo]: [...ids] };
        if (campo === 'idRegiones') {
          const regionesSeleccionadas = new Set(siguiente.idRegiones.map(String));
          siguiente.idAreas = actual.idAreas.filter((idArea) => {
            const area = areas.find((item) => String(item.idArea) === String(idArea));
            return area && regionesSeleccionadas.has(String(area.idRegion));
          });
        }
        return { ...actuales, [usuario.idUsuario]: siguiente };
    });
  }

  async function guardarAsignacion(usuario) {
    const asignacionActual = cambios[usuario.idUsuario] ?? {
      rol: usuario.rol,
      idRegion: usuario.idRegion ?? '',
      idArea: usuario.idArea ?? '',
      idRegiones: usuario.idRegiones ?? (usuario.idRegion ? [usuario.idRegion] : []),
      idAreas: usuario.idAreas ?? (usuario.idArea ? [usuario.idArea] : []),
    };
    if (!ROLES.includes(asignacionActual.rol)) {
      setError('Seleccione un rol permitido para activar la cuenta.');
      return;
    }
    const areaSeleccionada = areas.find((area) => String(area.idArea) === String(asignacionActual.idArea));
    const esInspector = asignacionActual.rol === 'Inspector';
    if (!esInspector && requiereArea(asignacionActual.rol) &&
        (!asignacionActual.idRegion || !areaSeleccionada || String(areaSeleccionada.idRegion) !== String(asignacionActual.idRegion))) {
      setError('Seleccione primero una región y luego un área de esa región.');
      return;
    }
    if (!esInspector && requiereRegion(asignacionActual.rol) && !requiereArea(asignacionActual.rol) && !asignacionActual.idRegion) {
      setError('Seleccione una región para el Director Regional.');
      return;
    }
    const asignacion = {
      ...asignacionActual,
      idArea: !esInspector && requiereArea(asignacionActual.rol) ? Number(asignacionActual.idArea) : null,
      idRegion: !esInspector && requiereRegion(asignacionActual.rol) ? Number(asignacionActual.idRegion) : null,
        idAreas: esInspector ? asignacionActual.idAreas.filter((idArea) => {
          const area = areas.find((item) => String(item.idArea) === String(idArea));
          return area && asignacionActual.idRegiones.map(String).includes(String(area.idRegion));
        }).map(Number) : [],
      idRegiones: esInspector ? asignacionActual.idRegiones.map(Number) : [],
    };
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      await actualizarAsignacionUsuario(usuario.idUsuario, asignacion);
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
        <div className="panel-admin__header-actions">
          <button className="panel-admin__refresh" type="button" onClick={onMenuPrincipal}>Menú principal</button>
          <button className="panel-admin__logout" type="button" onClick={onCerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      {error && <p className="panel-admin__notice panel-admin__notice--error" role="alert">{error}</p>}
      {mensaje && <p className="panel-admin__notice" role="status">{mensaje}</p>}

      <section className="panel-admin__section" aria-labelledby="usuarios-titulo">
        <div className="panel-admin__section-heading">
          <div>
            <h2 id="usuarios-titulo">Usuarios y asignaciones</h2>
            <p>Asigne roles y ubicaciones; las áreas del inspector deben pertenecer a sus regiones asignadas.</p>
          </div>
          <button className="panel-admin__refresh" type="button" onClick={cargarDatos} disabled={cargando}>Actualizar</button>
        </div>
        {cargando ? <p className="panel-admin__empty">Cargando usuarios…</p> : (
          <div className="panel-admin__table-wrap">
            <table className="panel-admin__table">
              <thead><tr><th>Nombre</th><th>Identificación</th><th>Correo</th><th>Rol</th><th>Región</th><th>Área</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {usuarios.map((usuario) => {
                    const valores = cambios[usuario.idUsuario] ?? {
                      rol: usuario.rol,
                      idRegion: usuario.idRegion ?? '',
                      idArea: usuario.idArea ?? '',
                      idRegiones: usuario.idRegiones ?? (usuario.idRegion ? [usuario.idRegion] : []),
                      idAreas: usuario.idAreas ?? (usuario.idArea ? [usuario.idArea] : []),
                    };
                    const areasDeRegion = areas.filter((area) => String(area.idRegion) === String(valores.idRegion));
                    const esInspector = valores.rol === 'Inspector';
                    const regionesInspector = new Set(valores.idRegiones.map(String));
                    const areasInspector = areas.filter((area) => regionesInspector.has(String(area.idRegion)));
                    const areasInspectorSeleccionadas = valores.idAreas.filter((idArea) =>
                      areasInspector.some((area) => String(area.idArea) === String(idArea)));
                  return (
                    <tr key={usuario.idUsuario}>
                      <td>{[usuario.nombre, usuario.primerApellido, usuario.segundoApellido].filter(Boolean).join(' ')}</td>
                      <td>{usuario.identificacion}</td>
                      <td>{usuario.correo}</td>
                        <td>
                          <select aria-label={`Rol de ${usuario.correo}`} value={valores.rol} onChange={(event) => cambioUsuario(usuario, 'rol', event.target.value)}>
                            {valores.rol === 'Pendiente' && <option value="Pendiente">Pendiente de asignación</option>}
                            {ROLES.map((rol) => <option key={rol} value={rol}>{rol}</option>)}
                          </select>
                        </td>
                        <td>
                          {esInspector ? (
                            <details className="panel-admin__assignments">
                              <summary>Regiones ({valores.idRegiones.length})</summary>
                              <div className="panel-admin__choices">
                                {regiones.map((region) => (
                                  <label key={region.idRegion}>
                                    <input type="checkbox" aria-label={`Región de ${usuario.correo}: ${region.nombre}`}
                                      checked={valores.idRegiones.map(String).includes(String(region.idRegion))}
                                      onChange={(event) => cambioUbicacionInspector(usuario, 'idRegiones', region.idRegion, event.target.checked)} />
                                    {region.nombre}
                                  </label>
                                ))}
                              </div>
                            </details>
                          ) : (
                          <select aria-label={`Región de ${usuario.correo}`} value={valores.idRegion} disabled={!requiereRegion(valores.rol)} onChange={(event) => cambioUsuario(usuario, 'idRegion', event.target.value)}>
                            <option value="">{requiereRegion(valores.rol) ? 'Seleccione región' : 'No aplica'}</option>
                            {regiones.map((region) => <option key={region.idRegion} value={region.idRegion}>{region.nombre}</option>)}
                          </select>
                          )}
                        </td>
                        <td>
                          {esInspector ? (
                            <details className="panel-admin__assignments">
                              <summary>Áreas ({areasInspectorSeleccionadas.length})</summary>
                              <div className="panel-admin__choices">
                                {areasInspector.map((area) => (
                                  <label key={area.idArea}>
                                    <input type="checkbox" aria-label={`Área de ${usuario.correo}: ${area.nombre}`}
                                      checked={areasInspectorSeleccionadas.map(String).includes(String(area.idArea))}
                                      onChange={(event) => cambioUbicacionInspector(usuario, 'idAreas', area.idArea, event.target.checked)} />
                                    {area.nombre} ({area.nombreRegion})
                                  </label>
                                ))}
                              </div>
                            </details>
                          ) : (
                          <select aria-label={`Área de ${usuario.correo}`} value={valores.idArea} disabled={!requiereArea(valores.rol) || !valores.idRegion} onChange={(event) => cambioUsuario(usuario, 'idArea', event.target.value)}>
                            <option value="">{requiereArea(valores.rol) ? 'Seleccione área' : 'No aplica'}</option>
                            {areasDeRegion.map((area) => <option key={area.idArea} value={area.idArea}>{area.nombre}</option>)}
                          </select>
                          )}
                        </td>
                      <td>{usuario.activo === 'S' ? 'Activo' : 'Inactivo'}</td>
                      <td><button className="panel-admin__save" type="button" disabled={guardando || !ROLES.includes(valores.rol) || (esInspector && (valores.idRegiones.length === 0 || areasInspectorSeleccionadas.length === 0)) || (!esInspector && requiereArea(valores.rol) && (!valores.idRegion || !valores.idArea)) || (!esInspector && requiereRegion(valores.rol) && !requiereArea(valores.rol) && !valores.idRegion)} onClick={() => guardarAsignacion(usuario)}>Guardar</button></td>
                    </tr>
                  );
                })}
                  {usuarios.length === 0 && <tr><td className="panel-admin__empty" colSpan="8">No hay usuarios para mostrar.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}