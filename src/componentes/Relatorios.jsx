import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { useEventos } from '../hooks/useEventos';
import { useColaboradores } from '../hooks/useColaboradores';
import { useTiposRegistro } from '../hooks/useTiposRegistro';
import { hexParaRgba } from '../utils/corUtils';
import { CabecalhoPagina } from './CabecalhoPagina';

const ehEventoFerias = (evento) => {
  if (!evento) return false;
  return (
    evento.tipo === 'ferias' ||
    (Boolean(evento.titulo) &&
      (evento.titulo.toLowerCase().includes('férias') || evento.titulo.toLowerCase().includes('ferias')))
  );
};

export const Relatorios = () => {
  const { eventos, carregando: carregandoEventos } = useEventos();
  const { colaboradores, carregando: carregandoColab } = useColaboradores();
  const { obterTipoPorChave } = useTiposRegistro();
  
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filtroColaborador, setFiltroColaborador] = useState('todos');

  // Filtra do banco ausências de colaboradores (folgas, férias e novos tipos que computam ausência)
  const ausencias = useMemo(() => {
    return eventos.filter(e => {
      if (ehEventoFerias(e)) return true;
      const info = obterTipoPorChave(e.tipo);
      if (info) return Boolean(info.computa_ausencia);
      return e.tipo === 'folga';
    });
  }, [eventos, obterTipoPorChave]);

  // Aplica os filtros da tela
  const folgasFiltradas = useMemo(() => {
    return ausencias.filter(folga => {
      let passaMes = true;
      let passaColab = true;

      if (filtroMes !== 'todos') {
        const mesFolga = folga.data.substring(0, 7); // Pega apenas YYYY-MM
        passaMes = mesFolga === filtroMes;
      }

      if (filtroColaborador !== 'todos') {
        passaColab = folga.colaborador_id === filtroColaborador;
      }

      return passaMes && passaColab;
    }).sort((a, b) => b.data.localeCompare(a.data)); // Ordem cronológica decrescente
  }, [ausencias, filtroMes, filtroColaborador]);

  // Extrair lista de meses únicos disponíveis para o `<select>`
  const mesesDisponiveis = useMemo(() => {
    const meses = new Set();
    ausencias.forEach(f => meses.add(f.data.substring(0, 7)));
    return Array.from(meses).sort((a, b) => b.localeCompare(a));
  }, [ausencias]);

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <CabecalhoPagina
        icone={TrendingUp}
        titulo="Relatórios de Ausências"
        subtitulo="Acompanhe o histórico completo de ausências e folgas da equipe."
      />

      <div className="dashboard-secao" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-grupo" style={{ marginBottom: 0, flex: 1, minWidth: '200px', maxWidth: '300px' }}>
          <label>Mês de Referência</label>
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
            <option value="todos">Todo o histórico</option>
            {mesesDisponiveis.map(mes => {
              // Converte "2026-10" para "10/2026"
              const partes = mes.split('-');
              return <option key={mes} value={mes}>{partes[1]}/{partes[0]}</option>;
            })}
          </select>
        </div>
        
        <div className="form-grupo" style={{ marginBottom: 0, flex: 1, minWidth: '200px', maxWidth: '300px' }}>
          <label>Colaborador</label>
          <select value={filtroColaborador} onChange={(e) => setFiltroColaborador(e.target.value)}>
            <option value="todos">Todos os colaboradores</option>
            {colaboradores.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard-secao" style={{ padding: 0, overflow: 'hidden' }}>
        {(carregandoEventos || carregandoColab) ? (
          <p style={{ padding: '2rem' }}>Carregando dados...</p>
        ) : folgasFiltradas.length === 0 ? (
          <p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Nenhuma folga encontrada para os filtros selecionados.</p>
        ) : (
          <div className="tabela-relatorio-scroll">
            <table className="tabela-relatorio">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Colaborador</th>
                  <th>Tipo</th>
                  <th>Motivo / Observação</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {folgasFiltradas.map(folga => {
                  const dataFormatada = folga.data.split('-').reverse().join('/');
                  const isFerias = ehEventoFerias(folga);
                  
                  // Lógica para determinar se a folga já passou, é hoje ou no futuro
                  const hoje = new Date();
                  const dataHojeLocal = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                  
                  let status = 'Agendada';
                  if (folga.data < dataHojeLocal) status = 'Concluída';
                  if (folga.data === dataHojeLocal) status = 'Ocorrendo';
                  
                  // Retirar acento para classe css (concluída -> concluida)
                  const classeCSS = status.toLowerCase().replace('í', 'i');

                  return (
                    <tr key={folga.id}>
                      <td style={{ fontWeight: 600 }}>{dataFormatada}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {folga.colaborador?.nome || 'Desconhecido'}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const tipoInfo = obterTipoPorChave(folga.tipo);
                          const rotuloTipo = isFerias ? 'Férias' : (tipoInfo?.nome || folga.tipo);
                          const corTipo = tipoInfo?.cor_hex || (isFerias ? '#f97316' : '#ef4444');

                          return (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: '999px',
                                background: hexParaRgba(corTipo, 0.15),
                                color: corTipo,
                                border: `1px solid ${hexParaRgba(corTipo, 0.35)}`,
                                display: 'inline-block',
                              }}
                            >
                              {rotuloTipo}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{folga.titulo}</td>
                      <td>
                        <span className={`badge-status ${classeCSS}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
