import React, { useState, useRef } from 'react';
import {
  Paperclip,
  UploadCloud,
  Trash2,
  Crop,
} from 'lucide-react';
import { formatarTamanhoBytes } from '../utils/imagemUtils';
import { ModalCorteImagem } from './ModalCorteImagem';
import './SeletorAnexo.css';

export const SeletorAnexo = ({
  anexo,
  aoMudar,
  desabilitado = false,
  rotulo = 'Anexo / Comprovante (Opcional)',
}) => {
  const [modalCorteAberto, setModalCorteAberto] = useState(false);
  const [arquivoBrutoParaCorte, setArquivoBrutoParaCorte] = useState(null);
  const [estaArrastando, setEstaArrastando] = useState(false);

  const inputArquivoRef = useRef(null);
  const arquivoBrutoCacheRef = useRef(null);

  // Manipula a seleção de arquivo via input ou drag & drop
  const processarArquivoSelecionado = (arquivo) => {
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (PNG, JPEG, WebP).');
      return;
    }

    arquivoBrutoCacheRef.current = arquivo;
    setArquivoBrutoParaCorte(arquivo);
    setModalCorteAberto(true);
  };

  const lidarComMudancaInput = (e) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      processarArquivoSelecionado(arquivo);
    }
    // Limpa o valor do input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const lidarComDragOver = (e) => {
    e.preventDefault();
    if (!desabilitado) {
      setEstaArrastando(true);
    }
  };

  const lidarComDragLeave = (e) => {
    e.preventDefault();
    setEstaArrastando(false);
  };

  const lidarComDrop = (e) => {
    e.preventDefault();
    setEstaArrastando(false);
    if (desabilitado) return;

    const arquivo = e.dataTransfer.files?.[0];
    if (arquivo) {
      processarArquivoSelecionado(arquivo);
    }
  };

  // Callback de conclusão do corte
  const lidarComConclusaoCorte = (blobOtimizado, metadados) => {
    const urlPrevia = URL.createObjectURL(blobOtimizado);

    aoMudar({
      blob: blobOtimizado,
      urlPrevia,
      nome: metadados.nome,
      tamanhoBytes: metadados.tamanhoBytes,
      tamanhoOriginal: metadados.tamanhoOriginal,
    });

    setModalCorteAberto(false);
  };

  // Reabrir recorte com a imagem original mantida
  const recortarNovamente = () => {
    if (arquivoBrutoCacheRef.current) {
      setArquivoBrutoParaCorte(arquivoBrutoCacheRef.current);
      setModalCorteAberto(true);
    } else if (anexo?.blob) {
      setArquivoBrutoParaCorte(anexo.blob);
      setModalCorteAberto(true);
    }
  };

  // Remover anexo selecionado
  const removerAnexo = () => {
    if (anexo?.urlPrevia) {
      URL.revokeObjectURL(anexo.urlPrevia);
    }
    arquivoBrutoCacheRef.current = null;
    aoMudar(null);
  };

  // Calcula a taxa de compressão / redução
  const calcularEconomia = () => {
    if (!anexo || !anexo.tamanhoOriginal || !anexo.tamanhoBytes) return null;
    if (anexo.tamanhoBytes >= anexo.tamanhoOriginal) return null;
    const reducaoPct = Math.round(
      ((anexo.tamanhoOriginal - anexo.tamanhoBytes) / anexo.tamanhoOriginal) * 100
    );
    return reducaoPct > 0 ? `-${reducaoPct}%` : null;
  };

  const porcentagemEconomia = calcularEconomia();

  return (
    <div className="seletor-anexo-container">
      <label className="seletor-anexo-rotulo">
        <Paperclip size={15} color="#64748b" />
        <span>{rotulo}</span>
      </label>

      {/* Input de arquivo invisível */}
      <input
        ref={inputArquivoRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={lidarComMudancaInput}
        className="seletor-anexo-input-oculto"
        disabled={desabilitado}
      />

      {/* Zona de Drop / Seleção (quando não há anexo) */}
      {!anexo ? (
        <div
          className={`seletor-anexo-dropzone ${estaArrastando ? 'arrastando' : ''}`}
          onClick={() => !desabilitado && inputArquivoRef.current?.click()}
          onDragOver={lidarComDragOver}
          onDragLeave={lidarComDragLeave}
          onDrop={lidarComDrop}
          role="button"
          tabIndex={0}
        >
          <div className="seletor-anexo-icone-upload">
            <UploadCloud size={24} />
          </div>
          <p className="seletor-anexo-texto-principal">
            Clique ou arraste um atestado / comprovante
          </p>
          <p className="seletor-anexo-texto-secundario">
            A imagem será recortada e compactada automaticamente
          </p>
        </div>
      ) : (
        /* Card com a Pré-visualização do Anexo Selecionado */
        <div className="seletor-anexo-card-previa">
          <div className="seletor-anexo-lado-esquerdo">
            <img
              src={anexo.urlPrevia || anexo.url}
              alt="Prévia do anexo selecionado"
              className="seletor-anexo-miniatura-img"
            />
            <div className="seletor-anexo-detalhes-arquivo">
              <span className="seletor-anexo-nome-arquivo" title={anexo.nome}>
                {anexo.nome || 'anexo-otimizado.webp'}
              </span>
              <div className="seletor-anexo-info-tamanho">
                <span>{formatarTamanhoBytes(anexo.tamanhoBytes)}</span>
                {porcentagemEconomia && (
                  <span
                    className="seletor-anexo-badge-economia"
                    title={`Reduzido de ${formatarTamanhoBytes(anexo.tamanhoOriginal)} para ${formatarTamanhoBytes(anexo.tamanhoBytes)}`}
                  >
                    otimizado {porcentagemEconomia}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="seletor-anexo-acoes">
            <button
              type="button"
              className="seletor-anexo-btn-acao"
              onClick={recortarNovamente}
              disabled={desabilitado}
              title="Ajustar o enquadramento ou recorte"
            >
              <Crop size={14} />
              <span>Ajustar</span>
            </button>
            <button
              type="button"
              className="seletor-anexo-btn-acao remover"
              onClick={removerAnexo}
              disabled={desabilitado}
              title="Remover anexo"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Recorte Interativo */}
      {modalCorteAberto && arquivoBrutoParaCorte && (
        <ModalCorteImagem
          arquivoImagem={arquivoBrutoParaCorte}
          aoConcluir={lidarComConclusaoCorte}
          aoCancelar={() => setModalCorteAberto(false)}
        />
      )}
    </div>
  );
};
