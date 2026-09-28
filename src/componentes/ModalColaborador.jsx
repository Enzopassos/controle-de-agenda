import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, Pencil, X, Sparkles } from 'lucide-react';
import './ModalColaborador.css';

const CARGOS_SUGERIDOS = [
  'Instrutor Prático',
  'Instrutor Teórico',
  'Diretor Geral',
  'Diretor de Ensino',
  'Atendimento / Recepção',
];

export const ModalColaborador = ({
  aberto,
  colaboradorParaEditar,
  aoSalvar,
  aoFechar,
  salvando,
}) => {
  const [nome, setNome] = useState(() => colaboradorParaEditar?.nome || '');
  const [cargo, setCargo] = useState(() => colaboradorParaEditar?.cargo || '');
  const [erroValidacao, setErroValidacao] = useState('');

  const ehEdicao = Boolean(colaboradorParaEditar);

  // Fecha o modal ao pressionar a tecla Escape
  useEffect(() => {
    if (!aberto) return;

    const lidarComTeclaEsc = (evento) => {
      if (evento.key === 'Escape' && !salvando) {
        aoFechar();
      }
    };

    window.addEventListener('keydown', lidarComTeclaEsc);
    return () => window.removeEventListener('keydown', lidarComTeclaEsc);
  }, [aberto, salvando, aoFechar]);

  if (!aberto) return null;

  const lidarComEnvio = (evento) => {
    evento.preventDefault();
    const nomeLimpo = nome.trim();
    const cargoLimpo = cargo.trim();

    if (!nomeLimpo) {
      setErroValidacao('Por favor, informe o nome completo do colaborador.');
      return;
    }

    setErroValidacao('');
    aoSalvar({
      nome: nomeLimpo,
      cargo: cargoLimpo,
    });
  };

  const conteudoModal = (
    <div
      className="modal-colaborador-overlay"
      onClick={salvando ? undefined : aoFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-colaborador-titulo-id"
    >
      <div
        className="modal-colaborador-box"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn-fechar-modal-colaborador"
          onClick={aoFechar}
          disabled={salvando}
          title="Fechar janela"
          aria-label="Fechar janela"
        >
          <X size={18} />
        </button>

        <div className="modal-colaborador-header">
          <div className="modal-colaborador-icone-topo" aria-hidden="true">
            {ehEdicao ? <Pencil size={20} /> : <UserPlus size={20} />}
          </div>
          <div className="modal-colaborador-header-textos">
            <h3 id="modal-colaborador-titulo-id" className="modal-colaborador-titulo">
              {ehEdicao ? 'Editar Colaborador' : 'Adicionar Colaborador'}
            </h3>
            <p className="modal-colaborador-subtitulo">
              {ehEdicao
                ? 'Atualize as informações do membro da equipe.'
                : 'Cadastre um novo colaborador para a escala da autoescola.'}
            </p>
          </div>
        </div>

        <form onSubmit={lidarComEnvio} className="modal-colaborador-form">
          {erroValidacao && (
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              border: '1px solid #fecaca'
            }}>
              {erroValidacao}
            </div>
          )}

          <div className="modal-campo-grupo">
            <label htmlFor="modal-colaborador-nome" className="modal-campo-rotulo">
              Nome Completo <span className="obrigatorio">*</span>
            </label>
            <input
              id="modal-colaborador-nome"
              type="text"
              className="modal-campo-input"
              placeholder="Ex: Carlos Eduardo de Oliveira"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="modal-campo-grupo">
            <label htmlFor="modal-colaborador-cargo" className="modal-campo-rotulo">
              Cargo / Especialidade
            </label>
            <input
              id="modal-colaborador-cargo"
              type="text"
              className="modal-campo-input"
              placeholder="Ex: Instrutor Prático - Categoria B"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            />
          </div>

          {/* Sugestões Rápidas de Cargos */}
          <div className="modal-sugestoes-cargos">
            <span className="modal-sugestoes-titulo">
              <Sparkles size={13} />
              Sugestões rápidas de cargo:
            </span>
            <div className="modal-sugestoes-grade">
              {CARGOS_SUGERIDOS.map((cargoSugerido) => (
                <button
                  key={cargoSugerido}
                  type="button"
                  className="chip-modal-sugestao"
                  onClick={() => setCargo(cargoSugerido)}
                >
                  + {cargoSugerido}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-colaborador-acoes">
            <button
              type="button"
              className="btn-modal-cancelar"
              onClick={aoFechar}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-modal-salvar"
              disabled={salvando}
            >
              {salvando
                ? 'Gravando...'
                : ehEdicao
                ? 'Salvar Alterações'
                : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(conteudoModal, document.body);
  }

  return conteudoModal;
};
