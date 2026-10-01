import { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RutaInicial, RutaProtegida } from './app/routing';
import { rutasAutenticacion } from './modules/auth/rutas';
import { rutasAdministracion } from './modules/administracion/rutas';
import { rutasInspecciones } from './modules/inspecciones/rutas';
import PantallaInicio from './components/PantallaInicio';
import { InspeccionModulo, existeProgresoGuardado } from './modules/inspecciones';
import { ActaGeneralModulo } from './modules/actaGeneral';

// Orden Sanitaria
import OrdenSanitariaModulo from './modules/ordenSanitaria/OrdenSanitariaModulo';
import { existeProgresoOrdenSanitaria } from './modules/ordenSanitaria/services/progresoOrdenSanitariaService';

const todasLasRutas = [
  ...rutasAutenticacion,
  ...rutasAdministracion,
  ...rutasInspecciones,
];

// DATOS DE PRUEBA TEMPORALES PARA PROBAR LA ORDEN SANITARIA
const inspeccionPruebaOrdenSanitaria = {
  idInspeccion: 7,// se coloca lo que genera el select 
  consecutivo: 'MS-DRRSCS-ARS-SJ-AI-0002-2026',
  nombreEstablecimiento: 'Restaurante El Buen Sabor',
  nombrePersonaNotificar: 'Juan Carlos Rodríguez Mora',
  identificacionPersonaNotificar: '1-1234-5678',
  tipoEstablecimiento: 'Servicio de Alimentación al Público',
};

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