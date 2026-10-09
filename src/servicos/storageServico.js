import { supabase } from './supabaseClient';

const NOME_BUCKET_ANEXOS = 'anexos_eventos';

/**
 * Serviço responsável por gerenciar uploads e exclusões no Supabase Storage.
 * Princípio da Responsabilidade Única (SRP) e Inversão de Dependência (DIP).
 */
export const storageServico = {
  /**
   * Faz upload de um arquivo ou Blob de imagem para o bucket do Supabase Storage.
   * @param {Blob|File} arquivoBlob
   * @param {string} nomeOriginal
   * @returns {Promise<{ url: string, nome: string, caminho: string }>}
   */
  fazerUploadAnexo: async (arquivoBlob, nomeOriginal = 'comprovante.webp') => {
    if (!arquivoBlob) {
      throw new Error('Nenhum arquivo fornecido para upload.');
    }

    // Sanitiza e gera um caminho único para o arquivo
    const nomeSeguro = nomeOriginal
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '_')
      .replace(/_+/g, '_');

    const timestamp = Date.now();
    const sufixoAleatorio = Math.random().toString(36).slice(2, 8);
    const caminhoArquivo = `${timestamp}_${sufixoAleatorio}_${nomeSeguro}`;

    const tipoMime = arquivoBlob.type || 'image/webp';

    const { error } = await supabase.storage
      .from(NOME_BUCKET_ANEXOS)
      .upload(caminhoArquivo, arquivoBlob, {
        contentType: tipoMime,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro no Supabase Storage ao enviar arquivo:', error);
      throw new Error(
        `Falha ao salvar anexo no servidor: ${error.message || 'Verifique as permissões do storage.'}`
      );
    }

    // Obtém a URL pública do arquivo enviado
    const { data: dadosUrl } = supabase.storage
      .from(NOME_BUCKET_ANEXOS)
      .getPublicUrl(caminhoArquivo);

    return {
      url: dadosUrl.publicUrl,
      nome: nomeOriginal,
      caminho: caminhoArquivo,
    };
  },

  /**
   * Remove um arquivo anexo do Supabase Storage utilizando sua URL ou caminho relativo.
   * @param {string} urlOuCaminho
   * @returns {Promise<boolean>}
   */
  removerAnexo: async (urlOuCaminho) => {
    if (!urlOuCaminho || typeof urlOuCaminho !== 'string') return false;

    try {
      let caminhoLimpo = urlOuCaminho;

      // Se for uma URL completa, extrai a parte relativa após o nome do bucket
      if (urlOuCaminho.includes(NOME_BUCKET_ANEXOS)) {
        const partes = urlOuCaminho.split(`${NOME_BUCKET_ANEXOS}/`);
        if (partes.length > 1) {
          caminhoLimpo = decodeURIComponent(partes[1].split('?')[0]);
        }
      }

      const { error } = await supabase.storage
        .from(NOME_BUCKET_ANEXOS)
        .remove([caminhoLimpo]);

      if (error) {
        console.warn('Aviso: Falha ao remover anexo do Storage:', error.message);
        return false;
      }

      return true;
    } catch (erro) {
      console.warn('Erro ao tentar remover anexo do storage:', erro);
      return false;
    }
  },
};
