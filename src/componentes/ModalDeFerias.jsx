import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Palmtree, Calendar, User, FileText, AlertCircle, RotateCw } from 'lucide-react';
import { useColaboradores } from '../hooks/useColaboradores';
import { formatarData } from '../utils/dataUtils';

export const ModalDeFerias = ({ aoFechar, aoSalvar }) => {
  const { colaboradores, carregando: carregandoColaboradores } = useColaboradores();

  const dataHoje = new Date();
  const dataHojeStr = formatarData(dataHoje);

  const [colaboradorId, setColaboradorId] = useState('');
  const [dataInicio, setDataInicio] = useState(dataHojeStr);
  const [dataFim, setDataFim] = useState(dataHojeStr);
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // Calcula a quantidade de dias do período
  const calcularQuantidadeDias = () => {
    if (!dataInicio || !dataFim) return 0;
    const inicio = new Date(dataInicio + 'T00:00:00');
    const fim = new Date(dataFim + 'T00:00:00');
    const diferencaMs = fim - inicio;
    if (diferencaMs < 0) return 0;
    return Math.round(diferencaMs / (1000 * 60 * 60 * 24)) + 1;
  };

  const quantidadeDias = calcularQuantidadeDias();

  const lidarComEnvio = async (e) => {
    e.preventDefault();
    setErro(null);

    if (!colaboradorId) {
      setErro('Selecione o colaborador que irá entrar de férias.');
      return;
    }

    if (!dataInicio || !dataFim) {
      setErro('Informe as datas de início e término das férias.');
      return;
    }

    if (dataFim < dataInicio) {
      setErro('A data de término não pode ser anterior à data de início.');
      return;
    }

    // Gerar lista de todos os dias do período de férias
    const listaDeEventos = [];
    const inicio = new Date(dataInicio + 'T00:00:00');
    const fim = new Date(dataFim + 'T00:00:00');
    const atual = new Date(inicio);

    const tituloFinal = observacoes.trim()
      ? `Férias - ${observacoes.trim()}`
      : 'Férias';

    while (atual <= fim) {
      listaDeEventos.push({
        data: formatarData(atual),
        titulo: tituloFinal,
        tipo: 'ferias',
        colaborador_id: colaboradorId,
      });
      atual.setDate(atual.getDate() + 1);
    }

    setSalvando(true);
    try {
      await aoSalvar(listaDeEventos);
      aoFechar();
    } catch (err) {
      console.error('Erro ao lançar férias:', err);
      setErro('Ocorreu um erro ao salvar o período de férias no banco.');
    } finally {
      setSalvando(false);
    }
  };

  const conteudoModal = (
    <div className="modal-overlay" onClick={aoFechar} style={{ zIndex: 9999 }}>
      <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#fff7ed',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #fed7aa',
            }}
          >
            <Palmtree size={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.45rem' }}>Lançar Férias</h3>
        </div>

        <p className="modal-data" style={{ marginBottom: '1.25rem' }}>
          Cadastre o período de férias completo de uma só vez no calendário.
        </p>

        {erro && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
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
          {/* Selecionar Colaborador */}
          <div className="form-grupo">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="#64748b" /> Colaborador
            </label>
            <select
              value={colaboradorId}
              onChange={(e) => setColaboradorId(e.target.value)}
              required
            >
              <option value="">Selecione o colaborador...</option>
              {(colaboradores || []).map((colaborador) => (
                <option key={colaborador.id} value={colaborador.id}>
                  {colaborador.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Intervalo de Datas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-grupo">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="#64748b" /> Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>

            <div className="form-grupo">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="#64748b" /> Término
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                min={dataInicio}
                required
              />
            </div>
          </div>

          {/* Indicador de Resumo dos Dias */}
          {quantidadeDias > 0 && (
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.15rem',
              }}
            >
              <span>Duração do período:</span>
              <span>
                {quantidadeDias} {quantidadeDias === 1 ? 'dia de férias' : 'dias de férias'}
              </span>
            </div>
          )}

          {/* Observações Opcionais */}
          <div className="form-grupo">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="#64748b" /> Observações (Opcional)
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Período regular, 1ª parcela..."
            />
          </div>

          {/* Ações */}
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
              disabled={salvando || carregandoColaboradores}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#ea580c',
                borderColor: '#ea580c',
              }}
            >
              {salvando ? (
                <>
                  <RotateCw size={16} className="icone-girando" />
                  <span>Lançando...</span>
                </>
              ) : (
                <>
                  <Palmtree size={16} />
                  <span>Confirmar Férias</span>
                </>
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
