import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../servicos/supabaseClient';
import { autenticacaoServico } from '../servicos/autenticacaoServico';
import { AutenticacaoContexto } from './AutenticacaoContexto';

export const AutenticacaoProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setUsuario(session?.user ?? null);
      setCarregando(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setSessao(session);
      setUsuario(session?.user ?? null);
      setCarregando(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const entrar = useCallback(async (email, senha) => {
    const dados = await autenticacaoServico.entrar(email, senha);
    return dados;
  }, []);

  const cadastrar = useCallback(async (email, senha, nome) => {
    const dados = await autenticacaoServico.cadastrar(email, senha, nome);
    return dados;
  }, []);

  const sair = useCallback(async () => {
    await autenticacaoServico.sair();
    setUsuario(null);
    setSessao(null);
  }, []);

  const valor = {
    usuario,
    sessao,
    carregando,
    autenticado: !!usuario,
    entrar,
    cadastrar,
    sair,
  };

  return (
    <AutenticacaoContexto.Provider value={valor}>
      {children}
    </AutenticacaoContexto.Provider>
  );
};
