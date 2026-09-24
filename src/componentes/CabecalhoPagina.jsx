import React from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './CabecalhoPagina.css';

export const CabecalhoPagina = ({
  titulo,
  subtitulo,
  trilha = [],
  acoes,
}) => {
  return (
    <header className="cabecalho-pagina animar-fade">
      <div className="cabecalho-pagina-conteudo">
        {/* Trilha de Navegação (Breadcrumbs) */}
        <nav aria-label="Trilha de navegação" className="trilha-navegacao">
          <ol className="trilha-lista">
            <li className="trilha-item">
              <Link 
                to="/dashboard"
                className="trilha-link trilha-link-home" 
                title="Ir para o início"
              >
                <Home size={14} />
                <span>Início</span>
              </Link>
            </li>

            {trilha.map((item, index) => {
              const ehUltimo = index === trilha.length - 1;

              return (
                <li key={`${item.rotulo}-${index}`} className="trilha-item">
                  <ChevronRight size={13} className="trilha-separador" />
                  {item.caminho && !ehUltimo ? (
                    <Link 
                      to={item.caminho}
                      className="trilha-link" 
                    >
                      {item.rotulo}
                    </Link>
                  ) : (
                    <span className="trilha-ativo" aria-current={ehUltimo ? 'page' : undefined}>
                      {item.rotulo}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Bloco de Título e Subtítulo */}
        <div className="cabecalho-pagina-titulos">
          <h1 className="cabecalho-pagina-titulo">{titulo}</h1>
          {subtitulo && <p className="cabecalho-pagina-subtitulo">{subtitulo}</p>}
        </div>
      </div>

      {/* Ações Específicas da Página */}
      {acoes && <div className="cabecalho-pagina-acoes">{acoes}</div>}
    </header>
  );
};
