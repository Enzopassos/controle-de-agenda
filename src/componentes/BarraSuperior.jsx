import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, User } from 'lucide-react';
import { useAutenticacao } from '../hooks/useAutenticacao';
import './BarraSuperior.css';

export const BarraSuperior = () => {
  const { usuario, sair } = useAutenticacao();
  const [menuAberto, setMenuAberto] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const lidarComCliqueFora = (evento) => {
      if (containerRef.current && !containerRef.current.contains(evento.target)) {
        setMenuAberto(false);
      }
    };

    const lidarComTeclaEsc = (evento) => {
      if (evento.key === 'Escape') {
        setMenuAberto(false);
      }
    };

    if (menuAberto) {
      document.addEventListener('mousedown', lidarComCliqueFora);
      document.addEventListener('keydown', lidarComTeclaEsc);
    }

    return () => {
      document.removeEventListener('mousedown', lidarComCliqueFora);
      document.removeEventListener('keydown', lidarComTeclaEsc);
    };
  }, [menuAberto]);

  const lidarComSair = async () => {
    try {
      setMenuAberto(false);
      await sair();
      navigate('/login');
    } catch (erro) {
      console.error('Erro ao sair:', erro);
    }
  };

  const obterIniciaisUsuario = (email) => {
    if (!email) return 'SJ';
    const partes = email.split('@')[0];
    return partes.substring(0, 2).toUpperCase();
  };

  return (
    <header className="barra-superior" aria-label="Barra Superior">
      <div className="barra-superior-espacador"></div>

      <div className="barra-superior-usuario-container" ref={containerRef}>
        {usuario && (
          <button
            type="button"
            className={`barra-superior-pilula ${menuAberto ? 'ativa' : ''}`}
            onClick={() => setMenuAberto(!menuAberto)}
            aria-expanded={menuAberto}
            aria-haspopup="true"
            title="Menu do usuário"
          >
            <div className="barra-superior-avatar">
              {usuario.email ? obterIniciaisUsuario(usuario.email) : <User size={16} />}
            </div>
            <span className="barra-superior-usuario-nome">{usuario.email}</span>
            <ChevronDown size={15} className={`barra-superior-chevron ${menuAberto ? 'rotacionado' : ''}`} />
          </button>
        )}

        {menuAberto && usuario && (
          <div className="barra-superior-dropdown" role="menu">
            <div className="barra-superior-dropdown-header">
              <span className="barra-superior-dropdown-rotulo">Conectado como</span>
              <span className="barra-superior-dropdown-email">{usuario.email}</span>
              <span className="barra-superior-dropdown-status">
                <span className="barra-superior-status-ponto"></span>
                Online
              </span>
            </div>

            <div className="barra-superior-dropdown-divisor"></div>

            <button
              type="button"
              className="barra-superior-dropdown-item-sair"
              onClick={lidarComSair}
              role="menuitem"
            >
              <LogOut size={16} />
              <span>Sair do sistema</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
