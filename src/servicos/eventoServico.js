import { supabase } from './supabaseClient';

export const eventoServico = {
  obterTodos: async () => {
    // Busca eventos e faz JOIN com colaboradores para trazer o nome
    const { data, error } = await supabase
      .from('agenda_eventos')
      .select(`
        *,
        colaborador:agenda_colaboradores(id, nome, cargo)
      `);
    
    if (error) throw error;
    return data;
  },

  criar: async (novoEvento) => {
    const { data, error } = await supabase
      .from('agenda_eventos')
      .insert([novoEvento])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  criarVarios: async (listaDeEventos) => {
    if (!listaDeEventos || listaDeEventos.length === 0) return [];
    const { data, error } = await supabase
      .from('agenda_eventos')
      .insert(listaDeEventos)
      .select();
    
    if (error) throw error;
    return data;
  },


  remover: async (id) => {
    const { error } = await supabase
      .from('agenda_eventos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
