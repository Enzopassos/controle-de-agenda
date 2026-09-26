import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  TrendingUp,
  Settings,
  AppWindow,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  User
} from 'lucide-react';
import { useAutenticacao } from '../hooks/useAutenticacao';
import logoAutoEscola from '../assets/LOGO_SJ.png';

export const MenuLateral = () => {
  const [recolhidaDesktop, setRecolhidaDesktop] = useState(false);
  const [menuAbertoMobile, setMenuAbertoMobile] = useState(false);
  const { usuario, sair } = useAutenticacao();
  const navigate = useNavigate();

  const lidarComSair = async () => {
    try {
      await sair();
      navigate('/login');
    } catch (erro) {
      console.error('Erro ao sair:', erro);
    }
  };

  const aoFecharMobile = () => setMenuAbertoMobile(false);
  const aoAlternarRecolhidaDesktop = () => setRecolhidaDesktop(!recolhidaDesktop);

  const ITENS_PRINCIPAIS = [
    { caminho: '/dashboard', rotulo: 'Dashboard', icone: LayoutDashboard },
    { caminho: '/calendario', rotulo: 'Calendário', icone: CalendarDays },
  ];

  const ITENS_GESTAO = [
    { caminho: '/colaboradores', rotulo: 'Colaboradores', icone: Users },
    { caminho: '/relatorios', rotulo: 'Relatórios', icone: TrendingUp },
    { caminho: '/widget', rotulo: 'Widget Desktop', icone: AppWindow },
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
          title="Agenda Auto Escola São João"
          onClick={() => {
            navigate('/dashboard');
            aoFecharMobile();
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="menu-lateral-logo-container">
            <img src={logoAutoEscola} alt="Auto Escola São João" className="menu-lateral-logo-img" />
          </div>
          {!recolhidaDesktop && (
            <div className="menu-lateral-marca-texto">
              <span className="menu-lateral-titulo">Auto Escola São João</span>
              <span className="menu-lateral-subtitulo">Controle de Agenda</span>
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
        {usuario && (
          <div className="menu-lateral-usuario-box">
            <div className="menu-lateral-usuario-info" title={usuario.email}>
              <div className="menu-lateral-usuario-avatar">
                <User size={15} />
              </div>
              {!recolhidaDesktop && (
                <div className="menu-lateral-usuario-textos">
                  <span className="menu-lateral-usuario-rotulo">Conectado</span>
                  <span className="menu-lateral-usuario-email">{usuario.email}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="menu-lateral-btn-sair"
              onClick={lidarComSair}
              title="Sair do sistema"
              aria-label="Sair do sistema"
            >
              <LogOut size={16} />
              {!recolhidaDesktop && <span>Sair</span>}
            </button>
          </div>
        )}

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
