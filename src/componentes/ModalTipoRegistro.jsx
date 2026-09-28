import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Pencil, X } from 'lucide-react';
import { PALETA_CORES_SUGERIDAS } from '../utils/corUtils';
import './ModalTipoRegistro.css';

export const ModalTipoRegistro = ({
  aberto,
  tipoParaEditar,
  aoSalvar,
  aoFechar,
  salvando,
}) => {
  const [nome, setNome] = useState(() => tipoParaEditar?.nome || '');
  const [corHex, setCorHex] = useState(() => tipoParaEditar?.cor_hex || '#3b82f6');
  const [exigeColaborador, setExigeColaborador] = useState(() => Boolean(tipoParaEditar?.exige_colaborador));
  const [computaAusencia, setComputaAusencia] = useState(() => Boolean(tipoParaEditar?.computa_ausencia));
  const [erroValidacao, setErroValidacao] = useState('');

  const ehEdicao = Boolean(tipoParaEditar);

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

    if (!nomeLimpo) {
      setErroValidacao('Por favor, informe o nome do tipo de registro.');
      return;
    }

    setErroValidacao('');
    aoSalvar({
      nome: nomeLimpo,
      cor_hex: corHex,
      exige_colaborador: exigeColaborador,
      computa_ausencia: computaAusencia,
    });
  };

  const conteudoModal = (
    <div
      className="modal-tipo-overlay"
      onClick={salvando ? undefined : aoFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-tipo-titulo-id"
    >
      <div
        className="modal-tipo-box"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn-fechar-modal-tipo"
          onClick={aoFechar}
          disabled={salvando}
          title="Fechar janela"
          aria-label="Fechar janela"
        >
          <X size={18} />
        </button>

        <div className="modal-tipo-header">
          <div
            className="modal-tipo-icone-topo"
            style={{
              backgroundColor: corHex,
              color: '#ffffff',
            }}
            aria-hidden="true"
          >
            {ehEdicao ? <Pencil size={20} /> : <Tag size={20} />}
          </div>
          <div className="modal-tipo-header-textos">
            <h3 id="modal-tipo-titulo-id" className="modal-tipo-titulo">
              {ehEdicao ? 'Editar Tipo de Registro' : 'Novo Tipo de Registro'}
            </h3>
            <p className="modal-tipo-subtitulo">
              {ehEdicao
                ? 'Atualize a cor oficial e as regras operacionais da categoria.'
                : 'Crie uma nova categoria de agendamento para o calendário.'}
            </p>
          </div>
        </div>

        <form onSubmit={lidarComEnvio} className="modal-tipo-form">
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

          {/* Nome da Categoria */}
          <div className="modal-campo-grupo">
            <label htmlFor="modal-tipo-nome" className="modal-campo-rotulo">
              Nome da Categoria <span className="obrigatorio">*</span>
            </label>
            <input
              id="modal-tipo-nome"
              type="text"
              className="modal-campo-input"
              placeholder="Ex: Exame Prático Detran, Aula Noturna..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Seletor de Cor Oficial */}
          <div className="modal-campo-grupo">
            <label className="modal-campo-rotulo">
              Cor Oficial no Sistema <span className="obrigatorio">*</span>
            </label>
            <div className="seletor-cor-container">
              <div className="seletor-cor-linha-topo">
                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                  Amostra e Código HEX:
                </span>
                <div className="seletor-cor-input-bloco">
                  <input
                    type="color"
                    className="input-cor-nativo"
                    value={corHex}
                    onChange={(e) => setCorHex(e.target.value)}
                    title="Escolha uma cor personalizada"
                  />
                  <input
                    type="text"
                    className="input-cor-hex-texto"
                    value={corHex}
                    onChange={(e) => setCorHex(e.target.value)}
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Paleta Rápida de Cores */}
              <div className="paleta-cores-grade">
                {PALETA_CORES_SUGERIDAS.map((cor) => (
                  <button
                    key={cor.hex}
                    type="button"
                    className={`btn-cor-sugerida ${corHex.toLowerCase() === cor.hex.toLowerCase() ? 'selecionada' : ''}`}
                    style={{ backgroundColor: cor.hex }}
                    onClick={() => setCorHex(cor.hex)}
                    title={cor.rotulo}
                    aria-label={cor.rotulo}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Regras Operacionais da Categoria */}
          <div className="regras-operacionais-bloco">
            <label className="regras-titulo-secao">Regras de Preenchimento da Agenda</label>

            {/* Regra 1: Exige Colaborador */}
            <label className={`card-regra-opcao ${exigeColaborador ? 'ativo' : ''}`}>
              <input
                type="checkbox"
                className="checkbox-regra"
                checked={exigeColaborador}
                onChange={(e) => setExigeColaborador(e.target.checked)}
              />
              <div className="regra-info-textos">
                <span className="regra-rotulo-principal">
                  Exige vincular a um funcionário
                </span>
                <span className="regra-descricao-secundaria">
                  Ao agendar este tipo de registro, o sistema obrigará a seleção de um funcionário responsável.
                </span>
              </div>
            </label>

            {/* Regra 2: Computa Ausência */}
            <label className={`card-regra-opcao ${computaAusencia ? 'ativo' : ''}`}>
              <input
                type="checkbox"
                className="checkbox-regra"
                checked={computaAusencia}
                onChange={(e) => setComputaAusencia(e.target.checked)}
              />
              <div className="regra-info-textos">
                <span className="regra-rotulo-principal">
                  Computa como ausência da equipe (folga / férias)
                </span>
                <span className="regra-descricao-secundaria">
                  Este registro será contabilizado nas métricas de faltas e folgas nos relatórios gerenciais.
                </span>
              </div>
            </label>
          </div>

          {/* Rodapé de Ações */}
          <div className="modal-tipo-acoes">
            <button
              type="button"
              className="btn-modal-tipo-cancelar"
              onClick={aoFechar}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-modal-tipo-salvar"
              disabled={salvando}
            >
              {salvando
                ? 'Gravando...'
                : ehEdicao
                ? 'Salvar Alterações'
                : 'Cadastrar Categoria'}
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
