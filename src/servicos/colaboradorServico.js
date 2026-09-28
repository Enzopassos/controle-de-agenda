import { supabase } from './supabaseClient';

export const colaboradorServico = {
  obterTodos: async () => {
    const { data, error } = await supabase
      .from('agenda_colaboradores')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  criar: async (novoColaborador) => {
    const { data, error } = await supabase
      .from('agenda_colaboradores')
      .insert([novoColaborador])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  atualizar: async (id, dadosAtualizados) => {
    const { data, error } = await supabase
      .from('agenda_colaboradores')
      .update(dadosAtualizados)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  remover: async (id) => {
    const { error } = await supabase
      .from('agenda_colaboradores')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
