import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import './ModalConfirmacaoExclusao.css';

export const ModalConfirmacaoExclusao = ({
  titulo = "Excluir Item?",
  mensagem,
  nomeItem,
  onConfirmar,
  onCancelar,
}) => {
  return createPortal(
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-conteudo modal-confirmacao-box" onClick={(e) => e.stopPropagation()}>
        <button className="btn-fechar-modal-confirmacao" onClick={onCancelar} title="Fechar">
          <X size={18} />
        </button>

        <div className="confirmacao-header">
          <div className="confirmacao-icone-alerta">
            <AlertTriangle size={32} />
          </div>
          <h3 className="confirmacao-titulo">{titulo}</h3>
        </div>

        <div className="confirmacao-corpo">
          <p className="confirmacao-mensagem">
            {mensagem || "Tem certeza que deseja excluir o item"} <strong className="destaque-nome-item">"{nomeItem}"</strong>?
          </p>
          <span className="confirmacao-aviso">Esta ação não poderá ser desfeita.</span>
        </div>

        <div className="confirmacao-acoes">
          <button className="btn-cancelar-confirmacao" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-excluir-confirmacao" onClick={onConfirmar}>
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
