import { Routes, Route, Navigate } from 'react-router-dom';
import { Calendario } from './componentes/Calendario';
import { MenuLateral } from './componentes/MenuLateral';
import { GestaoColaboradores } from './componentes/GestaoColaboradores';
import { Dashboard } from './componentes/Dashboard';
import { Relatorios } from './componentes/Relatorios';
import './estilos/index.css';

function App() {
  return (
    <div className="layout-principal">
      <MenuLateral />
      
      <main className="conteudo-principal">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/colaboradores" element={<GestaoColaboradores />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
