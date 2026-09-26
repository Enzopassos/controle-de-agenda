import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import './ModalConfirmacaoExclusao.css';

/**
 * Componente modal de confirmação para ações de exclusão destrutivas.
 * Adaptado do padrão do Controle Financeiro Passos.
 */
export const ModalConfirmacaoExclusao = ({
  titulo = 'Excluir Item?',
  mensagem,
  nomeItem,
  aoConfirmar,
  aoCancelar,
  onConfirmar,
  onCancelar
}) => {
  const lidarComConfirmar = aoConfirmar || onConfirmar;
  const lidarComCancelar = aoCancelar || onCancelar;

  // Fecha o modal ao pressionar a tecla Escape
  useEffect(() => {
    const lidarComTecla = (evento) => {
      if (evento.key === 'Escape' && lidarComCancelar) {
        lidarComCancelar();
      }
    };

    window.addEventListener('keydown', lidarComTecla);
    return () => window.removeEventListener('keydown', lidarComTecla);
  }, [lidarComCancelar]);

  const conteudoModal = (
    <div
      className="modal-overlay modal-confirmacao-overlay"
      onClick={lidarComCancelar}
      style={{ zIndex: 10000 }}
    >
      <div
        className="modal-conteudo modal-confirmacao-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
      >
        <button
          type="button"
          className="btn-fechar-modal-confirmacao"
          onClick={lidarComCancelar}
          title="Fechar"
        >
          <X size={18} />
        </button>

        <div className="confirmacao-header">
          <div className="confirmacao-icone-alerta">
            <AlertTriangle size={32} />
          </div>
          <h3 id="confirmacao-titulo" className="confirmacao-titulo">
            {titulo}
          </h3>
        </div>

        <div className="confirmacao-corpo">
          <p className="confirmacao-mensagem">
            {mensagem || 'Tem certeza que deseja excluir'}{' '}
            {nomeItem && <strong className="destaque-nome-item">"{nomeItem}"</strong>}?
          </p>
          <span className="confirmacao-aviso">Esta ação não poderá ser desfeita.</span>
        </div>

        <div className="confirmacao-acoes">
          <button
            type="button"
            className="btn-cancelar-confirmacao"
            onClick={lidarComCancelar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-excluir-confirmacao"
            onClick={lidarComConfirmar}
          >
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(conteudoModal, document.body);
  }

  return conteudoModal;
};
