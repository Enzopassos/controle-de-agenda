import { useState, useEffect, useCallback } from 'react';
import { colaboradorServico } from '../servicos/colaboradorServico';

const CACHE_KEY = 'agenda_colaboradores_cache';

export const useColaboradores = () => {
  const [colaboradores, setColaboradores] = useState(() => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        const parsed = JSON.parse(cache);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignora erro de parse
    }
    return [];
  });
  
  const [carregando, setCarregando] = useState(() => {
    return localStorage.getItem(CACHE_KEY) ? false : true;
  });

  const carregar = useCallback(async () => {
    if (!localStorage.getItem(CACHE_KEY)) {
      setCarregando(true);
    }
    
    try {
      const dados = await colaboradorServico.obterTodos();
      const listaSegura = Array.isArray(dados) ? dados : [];
      setColaboradores(listaSegura);
      localStorage.setItem(CACHE_KEY, JSON.stringify(listaSegura));
    } catch (erro) {
      console.error('Erro ao carregar colaboradores', erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const adicionar = async (dados) => {
    try {
      await colaboradorServico.criar(dados);
      await carregar();
    } catch (erro) {
      console.error('Erro ao adicionar colaborador', erro);
    }
  };

  const remover = async (id) => {
    try {
      await colaboradorServico.remover(id);
      await carregar();
    } catch (erro) {
      console.error('Erro ao remover colaborador', erro);
    }
  };

  return { colaboradores: colaboradores || [], carregando, adicionar, remover };
};
