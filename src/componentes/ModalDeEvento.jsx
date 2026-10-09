import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatarData } from '../utils/dataUtils';
import { useColaboradores } from '../hooks/useColaboradores';
import { useTiposRegistro } from '../hooks/useTiposRegistro';
import { TIPOS_PADRAO_FALLBACK } from '../utils/corUtils';
import { SeletorAnexo } from './SeletorAnexo';
import { storageServico } from '../servicos/storageServico';
import { RotateCw, AlertCircle } from 'lucide-react';

export const ModalDeEvento = ({ data, aoFechar, aoSalvar }) => {
  const [titulo, setTitulo] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState('folga');
  const [colaboradorId, setColaboradorId] = useState('');
  const [anexo, setAnexo] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  
  const { colaboradores, carregando: carregandoColaboradores } = useColaboradores();
  const { tipos, obterTipoPorChave, carregando: carregandoTipos } = useTiposRegistro();

  // Listas seguras contra valores nulos ou indefinidos
  const listaTipos = Array.isArray(tipos) && tipos.length > 0 ? tipos : TIPOS_PADRAO_FALLBACK;
  const listaColaboradores = Array.isArray(colaboradores) ? colaboradores : [];

  // Garante que o tipo seja válido de acordo com os tipos cadastrados
  const tipo = listaTipos.some(t => t && t.chave === tipoSelecionado)
    ? tipoSelecionado
    : (listaTipos[0]?.chave || 'folga');

  const tipoSelecionadoObj = obterTipoPorChave ? obterTipoPorChave(tipo) : null;
  const exigeColaborador = tipoSelecionadoObj
    ? Boolean(tipoSelecionadoObj.exige_colaborador)
    : (tipo === 'folga' || tipo === 'ferias');

  const lidarComEnvio = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    if (exigeColaborador && !colaboradorId) return;

    setSalvando(true);
    setErro(null);

    try {
      let anexoUrl = null;
      let anexoNome = null;

      // Se houver arquivo anexo selecionado e recortado, faz upload para o Supabase Storage
      if (anexo?.blob) {
        const resultadoUpload = await storageServico.fazerUploadAnexo(
          anexo.blob,
          anexo.nome || 'comprovante.webp'
        );
        anexoUrl = resultadoUpload.url;
        anexoNome = resultadoUpload.nome;
      }

      await aoSalvar({
        data: formatarData(data),
        titulo: titulo.trim(),
        tipo,
        colaborador_id: exigeColaborador ? colaboradorId : null,
        anexo_url: anexoUrl,
        anexo_nome: anexoNome,
      });

      aoFechar();
    } catch (err) {
      console.error('Erro ao agendar ocorrência:', err);
      setErro('Ocorreu um erro ao salvar o agendamento: ' + (err.message || 'Erro desconhecido.'));
    } finally {
      setSalvando(false);
    }
  };

  // Garante que a data seja tratada com segurança
  const dataSegura = data instanceof Date && !isNaN(data.getTime()) 
    ? data 
    : (data ? new Date(data) : new Date());

  const dataFormatadaTexto = dataSegura.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const obterRotuloTitulo = () => {
    if (!exigeColaborador) {
      if (tipo === 'feriado') return 'Nome do Feriado';
      return 'Título do Evento';
    }
    if (tipo === 'ferias') return 'Observações das Férias';
    return 'Motivo da Folga / Ausência';
  };

  const obterPlaceholderTitulo = () => {
    if (!exigeColaborador) {
      if (tipo === 'feriado') return 'Ex: Sexta-Feira Santa, Tiradentes...';
      return 'Ex: Reunião Geral, Treinamento Interno...';
    }
    if (tipo === 'ferias') return 'Ex: Férias regulares...';
    return 'Ex: Folga semanal, Banco de horas, Atestado médico...';
  };

  const conteudoModal = (
    <div className="modal-overlay" onClick={aoFechar} style={{ zIndex: 9999 }}>
      <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
        <h3>Agendar no Calendário</h3>
        <p className="modal-data">{dataFormatadaTexto}</p>

        {erro && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={lidarComEnvio}>
          <div className="form-grupo">
            <label>Tipo de Registro</label>
            <select
              value={tipo}
              onChange={(e) => setTipoSelecionado(e.target.value)}
              disabled={salvando}
            >
              {listaTipos.map((itemTipo) => (
                <option key={itemTipo.id || itemTipo.chave} value={itemTipo.chave}>
                  {itemTipo.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grupo">
            <label>{obterRotuloTitulo()}</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={obterPlaceholderTitulo()}
              required
              disabled={salvando}
            />
          </div>

          {exigeColaborador && (
            <div className="form-grupo">
              <label>Colaborador</label>
              <select 
                value={colaboradorId} 
                onChange={(e) => setColaboradorId(e.target.value)}
                required={exigeColaborador}
                disabled={salvando}
              >
                <option value="">Selecione um colaborador...</option>
                {listaColaboradores.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Campo de Anexo com Recorte e Otimização */}
          <div className="form-grupo">
            <SeletorAnexo
              anexo={anexo}
              aoMudar={setAnexo}
              desabilitado={salvando}
              rotulo={
                tipo === 'folga'
                  ? 'Atestado Médico / Comprovante (Opcional)'
                  : 'Anexo / Comprovante (Opcional)'
              }
            />
          </div>

          <div className="modal-acoes">
            <button
              type="button"
              className="btn btn-cancelar"
              onClick={aoFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-salvar"
              disabled={
                salvando ||
                (carregandoColaboradores && exigeColaborador) ||
                carregandoTipos
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {salvando ? (
                <>
                  <RotateCw size={15} className="icone-girando" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(conteudoModal, document.body);
  }

  return conteudoModal;
};
