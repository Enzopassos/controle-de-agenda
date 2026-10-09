import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Crop,
  RotateCw,
  Check,
  Maximize2,
} from 'lucide-react';
import { carregarImagem } from '../utils/imagemUtils';
import './ModalCorteImagem.css';

const LARGURA_MAXIMA_PALCO = 620;
const ALTURA_MAXIMA_PALCO = 410;
const TAMANHO_MINIMO_CORTE = 35;

const PROPORCOES_DISPONIVEIS = [
  { chave: 'livre', rotulo: 'Livre', valor: 0 },
  { chave: 'documento', rotulo: 'A4 / Doc (3:4)', valor: 3 / 4 },
  { chave: 'paisagem', rotulo: 'Paisagem (4:3)', valor: 4 / 3 },
  { chave: 'quadrado', rotulo: 'Quadrado (1:1)', valor: 1 },
];

export const ModalCorteImagem = ({
  arquivoImagem,
  aoConcluir,
  aoCancelar,
}) => {
  const [imagemElemento, setImagemElemento] = useState(null);
  const [urlImagem, setUrlImagem] = useState('');
  const [dimensaoExibida, setDimensaoExibida] = useState({ largura: 0, altura: 0 });
  const [corte, setCorte] = useState({ x: 0, y: 0, largura: 0, altura: 0 });
  const [proporcaoAtiva, setProporcaoAtiva] = useState('livre');
  const [processando, setProcessando] = useState(false);

  // Referência para o estado do arraste/redimensionamento
  const interacaoRef = useRef({
    tipo: null, // 'mover' ou alça ('nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w')
    pontoInicialX: 0,
    pontoInicialY: 0,
    corteInicial: null,
  });

  // Calcula o tamanho que a imagem ocupará na tela mantendo seu aspect ratio natural
  const calcularDimensoesVisiveis = useCallback((larguraOriginal, alturaOriginal) => {
    const prop = larguraOriginal / alturaOriginal;
    let largura = larguraOriginal;
    let altura = alturaOriginal;

    if (largura > LARGURA_MAXIMA_PALCO || altura > ALTURA_MAXIMA_PALCO) {
      if (largura / LARGURA_MAXIMA_PALCO > altura / ALTURA_MAXIMA_PALCO) {
        largura = LARGURA_MAXIMA_PALCO;
        altura = Math.round(largura / prop);
      } else {
        altura = ALTURA_MAXIMA_PALCO;
        largura = Math.round(altura * prop);
      }
    }

    return { largura, altura };
  }, []);

  // Inicializa o retângulo de corte sobre a imagem
  const criarRetanguloCorte = useCallback((larguraVisivel, alturaVisivel, propChave = 'livre') => {
    let largura = Math.round(larguraVisivel * 0.88);
    let altura = Math.round(alturaVisivel * 0.88);

    const configProp = PROPORCOES_DISPONIVEIS.find((p) => p.chave === propChave);
    const propDesejada = configProp?.valor || 0;

    if (propDesejada > 0) {
      if (largura / altura > propDesejada) {
        largura = Math.round(altura * propDesejada);
      } else {
        altura = Math.round(largura / propDesejada);
      }
    }

    const x = Math.max(0, Math.round((larguraVisivel - largura) / 2));
    const y = Math.max(0, Math.round((alturaVisivel - altura) / 2));

    return { x, y, largura, altura };
  }, []);

  // Carrega a imagem a partir do arquivo
  useEffect(() => {
    if (!arquivoImagem) return;

    let ativo = true;
    carregarImagem(arquivoImagem)
      .then((img) => {
        if (!ativo) return;
        setImagemElemento(img);
        setUrlImagem(img.src);

        const dim = calcularDimensoesVisiveis(img.naturalWidth, img.naturalHeight);
        setDimensaoExibida(dim);
        setCorte(criarRetanguloCorte(dim.largura, dim.altura, proporcaoAtiva));
      })
      .catch((erro) => {
        console.error('Erro ao carregar imagem para corte:', erro);
      });

    return () => {
      ativo = false;
    };
  }, [arquivoImagem, calcularDimensoesVisiveis, criarRetanguloCorte, proporcaoAtiva]);

  // Altera a proporção da caixa de corte
  const alternarProporcao = (chaveProp) => {
    setProporcaoAtiva(chaveProp);
    if (dimensaoExibida.largura > 0) {
      setCorte(criarRetanguloCorte(dimensaoExibida.largura, dimensaoExibida.altura, chaveProp));
    }
  };

  // Selecionar 100% da imagem
  const selecionarTudo = () => {
    setProporcaoAtiva('livre');
    setCorte({
      x: 0,
      y: 0,
      largura: dimensaoExibida.largura,
      altura: dimensaoExibida.altura,
    });
  };

  // Girar a imagem 90 graus
  const girarImagem = () => {
    if (!imagemElemento) return;

    const canvas = document.createElement('canvas');
    canvas.width = imagemElemento.naturalHeight;
    canvas.height = imagemElemento.naturalWidth;

    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(
      imagemElemento,
      -imagemElemento.naturalWidth / 2,
      -imagemElemento.naturalHeight / 2
    );

    const novaImg = new Image();
    novaImg.onload = () => {
      setImagemElemento(novaImg);
      setUrlImagem(novaImg.src);

      const dim = calcularDimensoesVisiveis(novaImg.naturalWidth, novaImg.naturalHeight);
      setDimensaoExibida(dim);
      setCorte(criarRetanguloCorte(dim.largura, dim.altura, proporcaoAtiva));
    };
    novaImg.src = canvas.toDataURL('image/png');
  };

  // Início da interação (arrastar ou redimensionar)
  const iniciarInteracao = (e, tipo) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }

    interacaoRef.current = {
      tipo,
      pontoInicialX: e.clientX,
      pontoInicialY: e.clientY,
      corteInicial: { ...corte },
      pointerId: e.pointerId,
    };
  };

  // Movimento da interação
  const moverInteracao = (e) => {
    const { tipo, pontoInicialX, pontoInicialY, corteInicial } = interacaoRef.current;
    if (!tipo || !corteInicial) return;

    const deltaX = e.clientX - pontoInicialX;
    const deltaY = e.clientY - pontoInicialY;
    const { largura: maxL, altura: maxA } = dimensaoExibida;

    let { x, y, largura, altura } = corteInicial;

    if (tipo === 'mover') {
      // Arrastar a caixa inteira mantendo-a dentro dos limites da imagem
      x = Math.max(0, Math.min(maxL - largura, corteInicial.x + deltaX));
      y = Math.max(0, Math.min(maxA - altura, corteInicial.y + deltaY));
      setCorte({ x, y, largura, altura });
      return;
    }

    // Redimensionamento pelas alças
    const configProp = PROPORCOES_DISPONIVEIS.find((p) => p.chave === proporcaoAtiva);
    const manterProporcao = (configProp?.valor || 0) > 0;
    const prop = configProp?.valor || 1;

    // Lado Leste (Direita)
    if (tipo.includes('e')) {
      largura = Math.max(TAMANHO_MINIMO_CORTE, Math.min(maxL - x, corteInicial.largura + deltaX));
      if (manterProporcao) {
        altura = Math.round(largura / prop);
        if (y + altura > maxA) {
          altura = maxA - y;
          largura = Math.round(altura * prop);
        }
      }
    }

    // Lado Sul (Baixo)
    if (tipo.includes('s')) {
      altura = Math.max(TAMANHO_MINIMO_CORTE, Math.min(maxA - y, corteInicial.altura + deltaY));
      if (manterProporcao && !tipo.includes('e') && !tipo.includes('w')) {
        largura = Math.round(altura * prop);
        if (x + largura > maxL) {
          largura = maxL - x;
          altura = Math.round(largura / prop);
        }
      }
    }

    // Lado Oeste (Esquerda)
    if (tipo.includes('w')) {
      const possivelLargura = corteInicial.largura - deltaX;
      if (possivelLargura >= TAMANHO_MINIMO_CORTE && corteInicial.x + deltaX >= 0) {
        x = corteInicial.x + deltaX;
        largura = possivelLargura;
        if (manterProporcao) {
          altura = Math.round(largura / prop);
          if (y + altura > maxA) {
            altura = maxA - y;
            largura = Math.round(altura * prop);
            x = corteInicial.x + corteInicial.largura - largura;
          }
        }
      }
    }

    // Lado Norte (Cima)
    if (tipo.includes('n')) {
      const possivelAltura = corteInicial.altura - deltaY;
      if (possivelAltura >= TAMANHO_MINIMO_CORTE && corteInicial.y + deltaY >= 0) {
        y = corteInicial.y + deltaY;
        altura = possivelAltura;
        if (manterProporcao && !tipo.includes('e') && !tipo.includes('w')) {
          largura = Math.round(altura * prop);
          if (x + largura > maxL) {
            largura = maxL - x;
            altura = Math.round(largura / prop);
            y = corteInicial.y + corteInicial.altura - altura;
          }
        }
      }
    }

    setCorte({ x, y, largura, altura });
  };

  // Fim da interação
  const finalizarInteracao = (e) => {
    if (e?.target?.releasePointerCapture && interacaoRef.current.pointerId) {
      try {
        e.target.releasePointerCapture(interacaoRef.current.pointerId);
      } catch {
        // Ignora caso já tenha sido liberado
      }
    }
    interacaoRef.current = {
      tipo: null,
      pontoInicialX: 0,
      pontoInicialY: 0,
      corteInicial: null,
    };
  };

  // Concluir e exportar a imagem recortada e comprimida
  const lidarComConclusao = async () => {
    if (!imagemElemento || !dimensaoExibida.largura) return;

    setProcessando(true);
    try {
      // Converte coordenadas visíveis na tela para a escala real da imagem original
      const fatorEscala = imagemElemento.naturalWidth / dimensaoExibida.largura;

      const xOriginal = Math.max(0, Math.round(corte.x * fatorEscala));
      const yOriginal = Math.max(0, Math.round(corte.y * fatorEscala));
      const larguraOriginal = Math.min(
        imagemElemento.naturalWidth - xOriginal,
        Math.round(corte.largura * fatorEscala)
      );
      const alturaOriginal = Math.min(
        imagemElemento.naturalHeight - yOriginal,
        Math.round(corte.altura * fatorEscala)
      );

      // Resolução máxima de segurança para atestados e documentos
      const LARGURA_MAXIMA_SAIDA = 1600;
      let larguraFinal = larguraOriginal;
      let alturaFinal = alturaOriginal;

      if (larguraFinal > LARGURA_MAXIMA_SAIDA || alturaFinal > LARGURA_MAXIMA_SAIDA) {
        if (larguraFinal > alturaFinal) {
          alturaFinal = Math.round((alturaFinal * LARGURA_MAXIMA_SAIDA) / larguraFinal);
          larguraFinal = LARGURA_MAXIMA_SAIDA;
        } else {
          larguraFinal = Math.round((larguraFinal * LARGURA_MAXIMA_SAIDA) / alturaFinal);
          alturaFinal = LARGURA_MAXIMA_SAIDA;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = larguraFinal;
      canvas.height = alturaFinal;

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, larguraFinal, alturaFinal);

      // Desenha o recorte exato
      ctx.drawImage(
        imagemElemento,
        xOriginal,
        yOriginal,
        larguraOriginal,
        alturaOriginal,
        0,
        0,
        larguraFinal,
        alturaFinal
      );

      // Compacta e converte para WebP
      const blobOtimizado = await new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/webp',
          0.82
        );
      });

      aoConcluir(blobOtimizado, {
        tamanhoBytes: blobOtimizado.size,
        tamanhoOriginal: arquivoImagem.size,
        nome: arquivoImagem.name
          ? arquivoImagem.name.replace(/\.[^/.]+$/, '.webp')
          : 'anexo.webp',
        largura: larguraFinal,
        altura: alturaFinal,
      });
    } catch (erro) {
      console.error('Erro ao recortar imagem:', erro);
    } finally {
      setProcessando(false);
    }
  };

  const conteudoModal = (
    <div
      className="modal-corte-overlay"
      onClick={aoCancelar}
      onPointerMove={moverInteracao}
      onPointerUp={finalizarInteracao}
    >
      <div className="modal-corte-container" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className="modal-corte-cabecalho">
          <div className="modal-corte-titulo-bloco">
            <div className="modal-corte-icone">
              <Crop size={22} />
            </div>
            <div>
              <h3 className="modal-corte-titulo">Recortar Comprovante / Anexo</h3>
              <p className="modal-corte-subtitulo">
                Ajuste a linha de corte sobre a imagem para enquadrar o atestado ou recibo.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-corte-btn-fechar"
            onClick={aoCancelar}
            title="Fechar"
          >
            &times;
          </button>
        </div>

        {/* Palco onde a imagem é exibida com a linha de corte sobre ela */}
        <div className="modal-corte-palco">
          {dimensaoExibida.largura > 0 && (
            <div
              className="modal-corte-imagem-container"
              style={{
                width: `${dimensaoExibida.largura}px`,
                height: `${dimensaoExibida.altura}px`,
              }}
            >
              {/* Imagem de Fundo Completa */}
              <img
                src={urlImagem}
                alt="Documento para recorte"
                className="modal-corte-img-fundo"
              />

              {/* Linha de Corte / Caixa de Seleção sobre a imagem */}
              <div
                className="modal-corte-caixa-selecao"
                style={{
                  left: `${corte.x}px`,
                  top: `${corte.y}px`,
                  width: `${corte.largura}px`,
                  height: `${corte.altura}px`,
                }}
                onPointerDown={(e) => iniciarInteracao(e, 'mover')}
              >
                {/* Linhas guias internas (Regra dos terços) */}
                <div className="modal-corte-grade-guias">
                  <div className="modal-corte-guia-h1" />
                  <div className="modal-corte-guia-h2" />
                  <div className="modal-corte-guia-v1" />
                  <div className="modal-corte-guia-v2" />
                </div>

                {/* Alças de Redimensionamento nos Cantos */}
                <div
                  className="alca-corte canto-nw"
                  onPointerDown={(e) => iniciarInteracao(e, 'nw')}
                />
                <div
                  className="alca-corte canto-ne"
                  onPointerDown={(e) => iniciarInteracao(e, 'ne')}
                />
                <div
                  className="alca-corte canto-sw"
                  onPointerDown={(e) => iniciarInteracao(e, 'sw')}
                />
                <div
                  className="alca-corte canto-se"
                  onPointerDown={(e) => iniciarInteracao(e, 'se')}
                />

                {/* Alças de Redimensionamento nas Bordas */}
                <div
                  className="alca-corte borda-n"
                  onPointerDown={(e) => iniciarInteracao(e, 'n')}
                />
                <div
                  className="alca-corte borda-s"
                  onPointerDown={(e) => iniciarInteracao(e, 's')}
                />
                <div
                  className="alca-corte borda-w"
                  onPointerDown={(e) => iniciarInteracao(e, 'w')}
                />
                <div
                  className="alca-corte borda-e"
                  onPointerDown={(e) => iniciarInteracao(e, 'e')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Barra de Ferramentas */}
        <div className="modal-corte-ferramentas">
          {/* Seletor de Proporções */}
          <div className="modal-corte-proporcoes">
            <span className="modal-corte-rotulo-proporcao">Formato:</span>
            {PROPORCOES_DISPONIVEIS.map((prop) => (
              <button
                key={prop.chave}
                type="button"
                className={`modal-corte-btn-proporcao ${
                  proporcaoAtiva === prop.chave ? 'ativo' : ''
                }`}
                onClick={() => alternarProporcao(prop.chave)}
              >
                {prop.rotulo}
              </button>
            ))}
          </div>

          {/* Botões Auxiliares */}
          <div className="modal-corte-botoes-acoes-topo">
            <button
              type="button"
              className="modal-corte-btn-auxiliar"
              onClick={selecionarTudo}
              title="Selecionar imagem completa"
            >
              <Maximize2 size={15} />
              <span>Selecionar Tudo</span>
            </button>
            <button
              type="button"
              className="modal-corte-btn-auxiliar"
              onClick={girarImagem}
              title="Girar imagem 90 graus"
            >
              <RotateCw size={15} />
              <span>Girar 90°</span>
            </button>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="modal-corte-rodape">
          <button
            type="button"
            className="modal-corte-btn-cancelar"
            onClick={aoCancelar}
            disabled={processando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="modal-corte-btn-concluir"
            onClick={lidarComConclusao}
            disabled={processando || !imagemElemento}
          >
            {processando ? (
              <span>Compactando...</span>
            ) : (
              <>
                <Check size={16} />
                <span>Aplicar Recorte</span>
              </>
            )}
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
