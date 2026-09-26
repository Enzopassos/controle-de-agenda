import { useState, useEffect, useCallback, useMemo } from 'react';
import { tipoRegistroServico } from '../servicos/tipoRegistroServico';
import { supabase } from '../servicos/supabaseClient';
import { TIPOS_PADRAO_FALLBACK } from '../utils/corUtils';

const CACHE_KEY = 'agenda_tipos_registro_cache';

export const useTiposRegistro = () => {
  const [tipos, setTipos] = useState(() => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        const parsed = JSON.parse(cache);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignora erro de parse de cache
    }
    return TIPOS_PADRAO_FALLBACK;
  });

  const [carregando, setCarregando] = useState(true);

  const carregarTipos = useCallback(async () => {
    try {
      const dados = await tipoRegistroServico.obterTodos();
      if (Array.isArray(dados) && dados.length > 0) {
        setTipos(dados);
        localStorage.setItem(CACHE_KEY, JSON.stringify(dados));
      } else {
        // Se a tabela ainda não tiver registros, usa os padrões
        setTipos(TIPOS_PADRAO_FALLBACK);
      }
    } catch (erro) {
      console.warn('Tabela agenda_tipos_registro ainda não configurada ou vazia. Utilizando tipos padrão temporariamente.', erro);
      setTipos(TIPOS_PADRAO_FALLBACK);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarTipos();

    // Sincronização em tempo real (Supabase Realtime) com canal único por instância
    const idCanal = `agenda_tipos_registro_${Math.random().toString(36).slice(2, 9)}`;
    const canal = supabase
      .channel(idCanal)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agenda_tipos_registro' },
        () => {
          carregarTipos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [carregarTipos]);

  const listaTiposSegura = Array.isArray(tipos) && tipos.length > 0 ? tipos : TIPOS_PADRAO_FALLBACK;

  const adicionarTipo = async (dados) => {
    try {
      const novoTipo = await tipoRegistroServico.criar(dados);
      await carregarTipos();
      return novoTipo;
    } catch (erro) {
      console.error('Erro ao adicionar tipo de registro:', erro);
      throw erro;
    }
  };

  const atualizarTipo = async (id, dados) => {
    try {
      const tipoAtualizado = await tipoRegistroServico.atualizar(id, dados);
      await carregarTipos();
      return tipoAtualizado;
    } catch (erro) {
      console.error('Erro ao atualizar tipo de registro:', erro);
      throw erro;
    }
  };

  const removerTipo = async (id) => {
    try {
      await tipoRegistroServico.remover(id);
      await carregarTipos();
    } catch (erro) {
      console.error('Erro ao remover tipo de registro:', erro);
      throw erro;
    }
  };

  // Mapa rápido de tipos indexado por chave e por id para busca O(1)
  const mapaTipos = useMemo(() => {
    const mapa = {};
    listaTiposSegura.forEach(t => {
      if (t) {
        if (t.chave) mapa[t.chave] = t;
        if (t.id) mapa[t.id] = t;
      }
    });
    return mapa;
  }, [listaTiposSegura]);

  const obterTipoPorChave = useCallback((chaveOuId) => {
    if (!chaveOuId) return null;
    if (mapaTipos[chaveOuId]) return mapaTipos[chaveOuId];

    // Procura por equivalência minúscula
    const busca = String(chaveOuId).toLowerCase().trim();
    const encontrado = listaTiposSegura.find(t => 
      t && (
        t.chave?.toLowerCase() === busca || 
        t.nome?.toLowerCase() === busca ||
        String(t.id) === busca
      )
    );

    return encontrado || null;
  }, [mapaTipos, listaTiposSegura]);

  return {
    tipos: listaTiposSegura,
    carregando,
    adicionarTipo,
    atualizarTipo,
    removerTipo,
    obterTipoPorChave,
    recarregarTipos: carregarTipos
  };
};
