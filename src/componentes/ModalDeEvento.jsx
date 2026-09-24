import { useState } from 'react';
import { formatarData } from '../utils/dataUtils';
import { useColaboradores } from '../hooks/useColaboradores';

export const ModalDeEvento = ({ data, aoFechar, aoSalvar }) => {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('folga');
  const [colaboradorId, setColaboradorId] = useState('');
  
  const { colaboradores, carregando } = useColaboradores();

  const lidarComEnvio = (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    aoSalvar({
      data: formatarData(data),
      titulo,
      tipo,
      colaborador_id: tipo === 'folga' ? colaboradorId : null
    });
    aoFechar();
  };

  const dataFormatadaTexto = data.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
        <h3>Agendar no Calendário</h3>
        <p className="modal-data">{dataFormatadaTexto}</p>

        <form onSubmit={lidarComEnvio}>
          <div className="form-grupo">
            <label>Tipo de Registro</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="folga">Folga de Colaborador</option>
              <option value="evento">Evento da Empresa</option>
            </select>
          </div>

          <div className="form-grupo">
            <label>{tipo === 'folga' ? 'Motivo / Observação' : 'Título do Evento'}</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={tipo === 'folga' ? 'Ex: Férias, Banco de horas...' : 'Ex: Reunião Geral...'}
              required
            />
          </div>

          {tipo === 'folga' && (
            <div className="form-grupo">
              <label>Colaborador</label>
              <select 
                value={colaboradorId} 
                onChange={(e) => setColaboradorId(e.target.value)}
                required
              >
                <option value="">Selecione um colaborador...</option>
                {colaboradores.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div className="modal-acoes">
            <button type="button" className="btn btn-cancelar" onClick={aoFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-salvar" disabled={carregando && tipo === 'folga'}>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
