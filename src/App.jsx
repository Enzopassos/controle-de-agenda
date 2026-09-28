import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AutenticacaoProvider } from './contextos/AutenticacaoProvider';
import { useAutenticacao } from './hooks/useAutenticacao';
import { RotaProtegida } from './componentes/RotaProtegida';
import { Login } from './componentes/Login';
import { Calendario } from './componentes/Calendario';
import { MenuLateral } from './componentes/MenuLateral';
import { BarraSuperior } from './componentes/BarraSuperior';
import { GestaoColaboradores } from './componentes/GestaoColaboradores';
import { GestaoTiposRegistro } from './componentes/GestaoTiposRegistro';
import { Dashboard } from './componentes/Dashboard';
import { Relatorios } from './componentes/Relatorios';
import { WidgetAgenda } from './componentes/WidgetAgenda';
import './estilos/index.css';

function LayoutWeb() {
  return (
    <div className="layout-principal">
      <MenuLateral />
      <div className="area-conteudo-wrapper">
        <BarraSuperior />
        <main className="conteudo-principal">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const ehAmbienteDesktop = typeof window !== 'undefined' && Boolean(
  window.__TAURI_INTERNALS__ ||
  window.__TAURI__ ||
  new URLSearchParams(window.location.search).get('desktop') === 'true'
);

function RedirecionadorInicial() {
  const { autenticado, carregando } = useAutenticacao();

  // No aplicativo Desktop instalado, abre SEMPRE direto o calendário do widget
  if (ehAmbienteDesktop) {
    return <Navigate to="/widget" replace />;
  }

  // Na Web, aguarda verificação de sessão se ainda estiver carregando
  if (carregando) {
    return null;
  }

  // Na Web, vai para o dashboard se logado ou login se deslogado
  return <Navigate to={autenticado ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <AutenticacaoProvider>
      <Routes>
        {/* Rota Inicial: Direciona automaticamente para o Widget no Desktop */}
        <Route path="/" element={<RedirecionadorInicial />} />

        {/* Rota Pública Exclusiva do Widget Flutuante */}
        <Route path="/widget" element={<WidgetAgenda />} />

        {/* Rota Pública de Autenticação */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Administrativas Privadas (Exigem Login na Web) */}
        <Route element={<RotaProtegida />}>
          <Route element={<LayoutWeb />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/colaboradores" element={<GestaoColaboradores />} />
            <Route path="/tipos" element={<GestaoTiposRegistro />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>
        </Route>

        {/* Redirecionamento Padrão */}
        <Route path="*" element={<RedirecionadorInicial />} />
      </Routes>
    </AutenticacaoProvider>
  );
}

export default App;
