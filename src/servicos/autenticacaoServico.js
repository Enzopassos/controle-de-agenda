import { supabase } from './supabaseClient';

export const autenticacaoServico = {
  entrar: async (email, senha) => {
    if (!email || !senha) {
      throw new Error('Informe o e-mail e a senha.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  sair: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return true;
  },

  obterSessao: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return data.session;
  },

  obterUsuario: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw error;
    }
    return data.user;
  },
};
