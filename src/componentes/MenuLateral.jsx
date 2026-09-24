import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export const MenuLateral = () => {
  const [recolhidaDesktop, setRecolhidaDesktop] = useState(false);
  const [menuAbertoMobile, setMenuAbertoMobile] = useState(false);
  const navigate = useNavigate();

  const aoFecharMobile = () => setMenuAbertoMobile(false);
  const aoAlternarRecolhidaDesktop = () => setRecolhidaDesktop(!recolhidaDesktop);

  const ITENS_PRINCIPAIS = [
    { caminho: '/dashboard', rotulo: 'Dashboard', icone: LayoutDashboard },
    { caminho: '/calendario', rotulo: 'Calendário', icone: CalendarDays },
  ];

  const ITENS_GESTAO = [
    { caminho: '/colaboradores', rotulo: 'Colaboradores', icone: Users },
    { caminho: '/relatorios', rotulo: 'Relatórios', icone: TrendingUp },
    { caminho: '/configuracoes', rotulo: 'Configurações', icone: Settings, emBreve: true },
  ];

  const renderizarItem = (item) => {
    const Icone = item.icone;

    if (item.emBreve) {
      return (
        <li key={item.caminho}>
          <div
            className="menu-lateral-item-btn item-desabilitado"
            title={recolhidaDesktop ? item.rotulo : undefined}
          >
            <span className="menu-lateral-item-icone">
              <Icone size={20} />
            </span>
            {!recolhidaDesktop && (
              <span className="menu-lateral-item-texto">{item.rotulo}</span>
            )}
            {!recolhidaDesktop && <span className="badge-em-breve">Breve</span>}
          </div>
        </li>
      );
    }

    return (
      <li key={item.caminho}>
        <NavLink
          to={item.caminho}
          onClick={aoFecharMobile}
          className={({ isActive }) =>
            `menu-lateral-item-btn ${isActive ? 'item-ativo' : ''}`
          }
          title={recolhidaDesktop ? item.rotulo : undefined}
        >
          <span className="menu-lateral-item-icone">
            <Icone size={20} />
          </span>
          {!recolhidaDesktop && (
            <span className="menu-lateral-item-texto">{item.rotulo}</span>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <aside
      className={`menu-lateral ${menuAbertoMobile ? 'mobile-aberta' : ''} ${recolhidaDesktop ? 'desktop-recolhida' : ''}`}
      aria-label="Menu Principal"
    >
      <div className="menu-lateral-cabecalho">
        <div
          className="menu-lateral-marca"
          title="AntiGravity ERP"
          onClick={() => {
            navigate('/dashboard');
            aoFecharMobile();
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="menu-lateral-logo-icone">
            <LayoutDashboard size={24} />
          </div>
          {!recolhidaDesktop && (
            <div className="menu-lateral-marca-texto">
              <span className="menu-lateral-titulo">AntiGravity</span>
              <span className="menu-lateral-subtitulo">ERP System</span>
            </div>
          )}
        </div>

        <button
          className="menu-lateral-btn-fechar-mobile"
          onClick={aoFecharMobile}
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="menu-lateral-nav">
        <span className="menu-lateral-secao-rotulo">
          {!recolhidaDesktop ? 'Principal' : 'Menu'}
        </span>
        <ul className="menu-lateral-lista">
          {ITENS_PRINCIPAIS.map(renderizarItem)}
        </ul>

        <div style={{ marginTop: '1.5rem' }}></div>
        <span className="menu-lateral-secao-rotulo">
          {!recolhidaDesktop ? 'Gestão' : 'Ger.'}
        </span>
        <ul className="menu-lateral-lista">
          {ITENS_GESTAO.map(renderizarItem)}
        </ul>
      </nav>

      <div className="menu-lateral-rodape">
        <button
          type="button"
          className="menu-lateral-btn-recolher"
          onClick={aoAlternarRecolhidaDesktop}
          title={recolhidaDesktop ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          aria-label={recolhidaDesktop ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {recolhidaDesktop ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!recolhidaDesktop && <span>Recolher menu</span>}
        </button>
      </div>
    </aside>
  );
};
