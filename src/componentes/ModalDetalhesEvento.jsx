import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  User,
  FileText,
  Paperclip,
  Maximize2,
  Download,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { hexParaRgba } from '../utils/corUtils';
import './ModalDetalhesEvento.css';

export const ModalDetalhesEvento = ({
  evento,
  aoFechar,
  aoSolicitarExclusao,
  resolverInformacoesTipo,
}) => {
  const [lightboxAberto, setLightboxAberto] = useState(false);

  if (!evento) return null;

  const infoTipo = resolverInformacoesTipo
    ? resolverInformacoesTipo(evento.tipo, evento)
    : { nome: evento.tipo, cor: '#2563eb' };

  // Formatação segura da data
  const partesData = evento.data ? evento.data.split('-') : [];
  let dataFormatada = evento.data;
  if (partesData.length === 3) {
    const dataObj = new Date(
      parseInt(partesData[0], 10),
      parseInt(partesData[1], 10) - 1,
      parseInt(partesData[2], 10)
    );
    dataFormatada = dataObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const temColaborador = Boolean(evento.colaborador?.nome);
  const temAnexo = Boolean(evento.anexo_url);

  const conteudoModal = (
    <div className="modal-detalhes-overlay" onClick={aoFechar}>
      <div className="modal-detalhes-container" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className="modal-detalhes-cabecalho">
          <div className="modal-detalhes-topo-esquerda">
            <span
              className="modal-detalhes-tipo-badge"
              style={{
                backgroundColor: hexParaRgba(infoTipo.cor, 0.14),
                color: infoTipo.cor,
                border: `1px solid ${hexParaRgba(infoTipo.cor, 0.3)}`,
              }}
            >
              {infoTipo.nome}
            </span>
            <h3 className="modal-detalhes-titulo">{evento.titulo}</h3>
          </div>
          <button
            type="button"
            className="modal-detalhes-btn-fechar"
            onClick={aoFechar}
            title="Fechar"
          >
            &times;
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="modal-detalhes-corpo">
          {/* Linha da Data */}
          <div className="modal-detalhes-linha-info">
            <div className="modal-detalhes-icone-info">
              <Calendar size={18} />
            </div>
            <span>
              <strong>Data:</strong> {dataFormatada}
            </span>
          </div>

          {/* Linha do Colaborador (se houver) */}
          {temColaborador && (
            <div className="modal-detalhes-linha-info">
              <div className="modal-detalhes-icone-info">
                <User size={18} />
              </div>
              <span>
                <strong>Colaborador:</strong> {evento.colaborador.nome}{' '}
                {evento.colaborador.cargo ? `(${evento.colaborador.cargo})` : ''}
              </span>
            </div>
          )}

          {/* Bloco de Visualização do Anexo */}
          {temAnexo ? (
            <div className="modal-detalhes-secao-anexo">
              <div className="modal-detalhes-anexo-topo">
                <span className="modal-detalhes-anexo-rotulo">
                  <Paperclip size={15} color="#2563eb" />
                  <span>Comprovante / Atestado Anexo</span>
                </span>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {evento.anexo_nome || 'anexo.webp'}
                </span>
              </div>

              {/* Moldura da Imagem */}
              <div
                className="modal-detalhes-anexo-moldura"
                onClick={() => setLightboxAberto(true)}
                title="Clique para visualizar em tela cheia"
              >
                <img
                  src={evento.anexo_url}
                  alt={evento.anexo_nome || 'Comprovante anexo'}
                  className="modal-detalhes-anexo-img"
                  loading="lazy"
                />
                <div className="modal-detalhes-anexo-overlay-hover">
                  <Maximize2 size={18} />
                  <span>Ampliar imagem</span>
                </div>
              </div>

              {/* Botões de Ação do Anexo */}
              <div className="modal-detalhes-anexo-acoes">
                <a
                  href={evento.anexo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-detalhes-btn-anexo"
                  title="Abrir imagem em uma nova aba"
                >
                  <ExternalLink size={14} />
                  <span>Abrir original</span>
                </a>
                <a
                  href={evento.anexo_url}
                  download={evento.anexo_nome || 'comprovante.webp'}
                  className="modal-detalhes-btn-anexo"
                  title="Baixar comprovante"
                >
                  <Download size={14} />
                  <span>Baixar</span>
                </a>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FileText size={16} />
              <span>Nenhum comprovante ou anexo foi vinculado a este agendamento.</span>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="modal-detalhes-rodape">
          {aoSolicitarExclusao ? (
            <button
              type="button"
              className="modal-detalhes-btn-excluir"
              onClick={() => {
                aoFechar();
                aoSolicitarExclusao(evento);
              }}
              title="Excluir este agendamento"
            >
              <Trash2 size={15} />
              <span>Excluir Ocorrência</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            className="modal-detalhes-btn-fechar-rodape"
            onClick={aoFechar}
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Lightbox em Tela Cheia */}
      {lightboxAberto && (
        <div
          className="modal-detalhes-lightbox"
          onClick={() => setLightboxAberto(false)}
        >
          <button
            type="button"
            className="modal-detalhes-lightbox-fechar"
            onClick={() => setLightboxAberto(false)}
            title="Fechar tela cheia"
          >
            &times;
          </button>
          <img
            src={evento.anexo_url}
            alt="Comprovante em alta resolução"
            className="modal-detalhes-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(conteudoModal, document.body);
  }

  return conteudoModal;
};
