import { useState, useEffect, useCallback } from 'react';
import { eventoServico } from '../servicos/eventoServico';

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
  }, [carregarEventos]);

  const adicionarEvento = async (dadosDoEvento) => {
    try {
      await eventoServico.criar(dadosDoEvento);
      await carregarEventos(); 
    } catch (erro) {
      console.error('Erro ao adicionar evento', erro);
    }
  };

  const removerEvento = async (id) => {
    try {
      await eventoServico.remover(id);
      await carregarEventos();
    } catch (erro) {
      console.error('Erro ao remover evento', erro);
    }
  };

  return {
    eventos,
    carregando,
    adicionarEvento,
    removerEvento
  };
};
