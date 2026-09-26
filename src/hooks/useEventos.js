import { useState, useEffect, useCallback } from 'react';
import { eventoServico } from '../servicos/eventoServico';
import { supabase } from '../servicos/supabaseClient';

const CACHE_KEY = 'agenda_eventos_cache';

export const useEventos = () => {
  const [eventos, setEventos] = useState(() => {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : [];
  });
  
  const [carregando, setCarregando] = useState(() => {
    return localStorage.getItem(CACHE_KEY) ? false : true;
  });

  const carregarEventos = useCallback(async () => {
    if (!localStorage.getItem(CACHE_KEY)) {
      setCarregando(true);
    }
    
    try {
      const dados = await eventoServico.obterTodos();
      setEventos(dados);
      localStorage.setItem(CACHE_KEY, JSON.stringify(dados));
    } catch (erro) {
      console.error('Erro ao carregar eventos', erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarEventos();

    // Sincronização em tempo real (Supabase Realtime) com canal único por instância
    const idCanal = `agenda_eventos_${Math.random().toString(36).slice(2, 9)}`;
    const canal = supabase
      .channel(idCanal)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agenda_eventos' },
        () => {
          carregarEventos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [carregarEventos]);

  const adicionarEvento = async (dadosDoEvento) => {
    try {
      await eventoServico.criar(dadosDoEvento);
      await carregarEventos(); 
    } catch (erro) {
      console.error('Erro ao adicionar evento', erro);
      throw erro;
    }
  };

  const adicionarVariosEventos = async (listaDeEventos) => {
    try {
      await eventoServico.criarVarios(listaDeEventos);
      await carregarEventos();
    } catch (erro) {
      console.error('Erro ao adicionar múltiplos eventos', erro);
      throw erro;
    }
  };

  const removerEvento = async (id) => {
    try {
      await eventoServico.remover(id);
      await carregarEventos();
    } catch (erro) {
      console.error('Erro ao remover evento', erro);
      throw erro;
    }
  };

  return {
    eventos,
    carregando,
    adicionarEvento,
    adicionarVariosEventos,
    removerEvento,
    recarregarEventos: carregarEventos
  };
};
