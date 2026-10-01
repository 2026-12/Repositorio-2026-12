import { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RutaInicial, RutaProtegida } from './app/routing';
import { rutasAutenticacion } from './modules/auth/rutas';
import { rutasAdministracion } from './modules/administracion/rutas';
import { rutasInspecciones } from './modules/inspecciones/rutas';
import { rutasActaGeneral } from './modules/actaGeneral/rutas';
import { rutasOrdenSanitaria } from './modules/ordenSanitaria/rutas';

const todasLasRutas = [
  ...rutasAutenticacion,
  ...rutasAdministracion,
  ...rutasInspecciones,
  ...rutasActaGeneral,
  ...rutasOrdenSanitaria,
];

function RutasAplicacion() {
  return (
    <Suspense fallback={<output className="app-loading">Cargando pantalla...</output>}>
      <Routes>
        <Route path="/" element={<RutaInicial />} />
        {todasLasRutas.map(({ path, element, roles, publica }) => (
          <Route
            key={path}
            path={path}
            element={(
              <RutaProtegida roles={roles} publica={publica}>
                {element}
              </RutaProtegida>
            )}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return <BrowserRouter><RutasAplicacion /></BrowserRouter>;
}

export default App;