/**
 * Utilitários de manipulação, recorte e otimização de imagens para anexos de ocorrências.
 * Princípio da Responsabilidade Única (SRP): Toda lógica de compressão e corte fica centralizada aqui.
 */

export const LARGURA_MAXIMA_PADRAO = 1600;
export const ALTURA_MAXIMA_PADRAO = 1600;
export const QUALIDADE_COMPRESSAO_PADRAO = 0.82;

/**
 * Converte um arquivo do tipo File em um objeto HTMLImageElement carregado.
 * @param {File|Blob} arquivo
 * @returns {Promise<HTMLImageElement>}
 */
export const carregarImagem = (arquivo) => {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (erro) => reject(new Error('Falha ao processar a imagem selecionada: ' + erro));
      img.src = leitor.result;
    };
    leitor.onerror = (erro) => reject(new Error('Falha ao ler o arquivo: ' + erro));
    leitor.readAsDataURL(arquivo);
  });
};

/**
 * Formata um valor em bytes para uma representação amigável (ex: "142 KB" ou "1.5 MB").
 * @param {number} bytes
 * @returns {string}
 */
export const formatarTamanhoBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const tamanhos = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${tamanhos[i]}`;
};

/**
 * Redimensiona e comprime uma imagem utilizando HTML5 Canvas e formato moderno WebP.
 * @param {HTMLImageElement|File|Blob} fonteImagem
 * @param {number} larguraMaxima
 * @param {number} qualidade
 * @returns {Promise<{ blob: Blob, largura: number, altura: number, tamanhoBytes: number }>}
 */
export const redimensionarEComprimirImagem = async (
  fonteImagem,
  larguraMaxima = LARGURA_MAXIMA_PADRAO,
  qualidade = QUALIDADE_COMPRESSAO_PADRAO
) => {
  let img = fonteImagem;
  if (fonteImagem instanceof File || fonteImagem instanceof Blob) {
    img = await carregarImagem(fonteImagem);
  }

  let larguraOriginal = img.naturalWidth || img.width;
  let alturaOriginal = img.naturalHeight || img.height;

  let novaLargura = larguraOriginal;
  let novaAltura = alturaOriginal;

  // Redimensionamento proporcional se exceder as dimensões máximas
  if (novaLargura > larguraMaxima || novaAltura > larguraMaxima) {
    if (novaLargura > novaAltura) {
      novaAltura = Math.round((novaAltura * larguraMaxima) / novaLargura);
      novaLargura = larguraMaxima;
    } else {
      novaLargura = Math.round((novaLargura * larguraMaxima) / novaAltura);
      novaAltura = larguraMaxima;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = novaLargura;
  canvas.height = novaAltura;

  const contexto = canvas.getContext('2d');
  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = 'high';

  // Fundo branco caso haja transparência (evita fundo preto em JPGs convertidos)
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, novaLargura, novaAltura);

  contexto.drawImage(img, 0, 0, novaLargura, novaAltura);

  // Tenta exportar em WebP com fallback para JPEG
  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (resultadoBlob) => {
        if (resultadoBlob) {
          resolve(resultadoBlob);
        } else {
          // Fallback para JPEG
          canvas.toBlob((blobJpeg) => resolve(blobJpeg), 'image/jpeg', qualidade);
        }
      },
      'image/webp',
      qualidade
    );
  });

  return {
    blob,
    largura: novaLargura,
    altura: novaAltura,
    tamanhoBytes: blob.size,
  };
};

/**
 * Realiza o recorte de uma região selecionada da imagem com suporte a rotação e compressão.
 * @param {HTMLImageElement} img
 * @param {{ x: number, y: number, largura: number, altura: number, rotacaoGraus?: number }} areaRecorte
 * @param {number} larguraMaxima
 * @param {number} qualidade
 * @returns {Promise<{ blob: Blob, largura: number, altura: number, tamanhoBytes: number }>}
 */
export const recortarImagemCanvas = async (
  img,
  areaRecorte,
  larguraMaxima = LARGURA_MAXIMA_PADRAO,
  qualidade = QUALIDADE_COMPRESSAO_PADRAO
) => {
  const { x, y, largura, altura } = areaRecorte;

  // Canvas intermediário para desenhar a área cortada
  const canvas = document.createElement('canvas');
  
  // Limita a resolução máxima de saída
  let larguraSaida = Math.round(largura);
  let alturaSaida = Math.round(altura);

  if (larguraSaida > larguraMaxima || alturaSaida > larguraMaxima) {
    if (larguraSaida > alturaSaida) {
      alturaSaida = Math.round((alturaSaida * larguraMaxima) / larguraSaida);
      larguraSaida = larguraMaxima;
    } else {
      larguraSaida = Math.round((larguraSaida * larguraMaxima) / alturaSaida);
      alturaSaida = larguraMaxima;
    }
  }

  canvas.width = larguraSaida;
  canvas.height = alturaSaida;

  const contexto = canvas.getContext('2d');
  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = 'high';

  // Fundo branco para segurança
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, larguraSaida, alturaSaida);

  // Desenha a fatia recortada no canvas
  contexto.drawImage(
    img,
    Math.max(0, x),
    Math.max(0, y),
    largura,
    altura,
    0,
    0,
    larguraSaida,
    alturaSaida
  );

  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (resultadoBlob) => {
        if (resultadoBlob) {
          resolve(resultadoBlob);
        } else {
          canvas.toBlob((blobJpeg) => resolve(blobJpeg), 'image/jpeg', qualidade);
        }
      },
      'image/webp',
      qualidade
    );
  });

  return {
    blob,
    largura: larguraSaida,
    altura: alturaSaida,
    tamanhoBytes: blob.size,
  };
};
