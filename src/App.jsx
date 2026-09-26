import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AutenticacaoProvider } from './contextos/AutenticacaoProvider';
import { RotaProtegida } from './componentes/RotaProtegida';
import { Login } from './componentes/Login';
import { Calendario } from './componentes/Calendario';
import { MenuLateral } from './componentes/MenuLateral';
import { GestaoColaboradores } from './componentes/GestaoColaboradores';
import { Dashboard } from './componentes/Dashboard';
import { Relatorios } from './componentes/Relatorios';
import { WidgetAgenda } from './componentes/WidgetAgenda';
import './estilos/index.css';

function LayoutWeb() {
  return (
    <div className="layout-principal">
      <MenuLateral />
      <main className="conteudo-principal">
        <Outlet />
      </main>
    </div>
  );
}

const ehAmbienteDesktop = typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);

function App() {
  return (
    <AutenticacaoProvider>
      <Routes>
        {/* Rota Pública de Autenticação */}
        <Route path="/login" element={<Login />} />

        {/* Rota Pública Exclusiva para o Widget de Desktop */}
        <Route path="/widget" element={<WidgetAgenda />} />

        {/* Rotas Administrativas Privadas (Exigem Login) */}
        <Route element={<RotaProtegida />}>
          <Route element={<LayoutWeb />}>
            <Route path="/" element={<Navigate to={ehAmbienteDesktop ? "/widget" : "/dashboard"} replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/colaboradores" element={<GestaoColaboradores />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>
        </Route>

        {/* Redirecionamento Padrão */}
        <Route path="*" element={<Navigate to={ehAmbienteDesktop ? "/widget" : "/dashboard"} replace />} />
      </Routes>
    </AutenticacaoProvider>
  );
}

export default App;
