import { supabase } from './supabaseClient';
import { gerarChaveSlug } from '../utils/corUtils';

export const tipoRegistroServico = {
  obterTodos: async () => {
    const { data, error } = await supabase
      .from('agenda_tipos_registro')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  criar: async (dadosDoTipo) => {
    const chave = dadosDoTipo.chave || gerarChaveSlug(dadosDoTipo.nome);
    const carga = {
      nome: dadosDoTipo.nome.trim(),
      chave,
      cor_hex: dadosDoTipo.cor_hex || '#3b82f6',
      exige_colaborador: Boolean(dadosDoTipo.exige_colaborador),
      computa_ausencia: Boolean(dadosDoTipo.computa_ausencia)
    };

    const { data, error } = await supabase
      .from('agenda_tipos_registro')
      .insert([carga])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  atualizar: async (id, dadosAtualizados) => {
    const carga = {
      nome: dadosAtualizados.nome.trim(),
      cor_hex: dadosAtualizados.cor_hex,
      exige_colaborador: Boolean(dadosAtualizados.exige_colaborador),
      computa_ausencia: Boolean(dadosAtualizados.computa_ausencia)
    };

    if (dadosAtualizados.chave) {
      carga.chave = dadosAtualizados.chave;
    }

    const { data, error } = await supabase
      .from('agenda_tipos_registro')
      .update(carga)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  remover: async (id) => {
    const { error } = await supabase
      .from('agenda_tipos_registro')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
