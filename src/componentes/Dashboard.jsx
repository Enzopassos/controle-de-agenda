import { useEventos } from '../hooks/useEventos';
import { useColaboradores } from '../hooks/useColaboradores';
import { formatarData } from '../utils/dataUtils';
import { CabecalhoPagina } from './CabecalhoPagina';

export const Dashboard = () => {
  const { eventos, carregando: carregandoEventos } = useEventos();
  const { colaboradores, carregando: carregandoColab } = useColaboradores();

  const dataHoje = new Date();
  const hojeStr = formatarData(dataHoje);
  const anoAtualStr = String(dataHoje.getFullYear());

  const dataDaqui15Dias = new Date(dataHoje);
  dataDaqui15Dias.setDate(dataHoje.getDate() + 15);
  const daqui15DiasStr = formatarData(dataDaqui15Dias);

  const eventosDeHoje = eventos.filter(e => e.data === hojeStr);
  
  const proximosEventos = eventos.filter(e => {
    return e.data > hojeStr && e.data <= daqui15DiasStr;
  }).sort((a, b) => a.data.localeCompare(b.data));

  const folgasEsteMes = eventos.filter(e => {
    const anoEvento = e.data.substring(0, 4);
    const mesEvento = e.data.substring(5, 7);
    const anoAtual = String(dataHoje.getFullYear());
    const mesAtual = String(dataHoje.getMonth() + 1).padStart(2, '0');
    return e.tipo === 'folga' && anoEvento === anoAtual && mesEvento === mesAtual;
  }).length;

  const rankingFolgas = colaboradores.map(colaborador => {
    const totalFolgas = eventos.filter(e => 
      e.tipo === 'folga' && 
      e.colaborador_id === colaborador.id &&
      e.data.startsWith(anoAtualStr)
    ).length;
    return { ...colaborador, totalFolgas };
  })
  .filter(c => c.totalFolgas > 0)
  .sort((a, b) => b.totalFolgas - a.totalFolgas);

  const renderizarListaEventos = (lista, mensagemVazia) => {
    if (lista.length === 0) {
      return <p style={{ color: 'var(--text-secondary)' }}>{mensagemVazia}</p>;
    }

    return (
      <div className="lista-eventos-dashboard">
        {lista.map(evento => {
          const isFolga = evento.tipo === 'folga';
          const partesData = evento.data.split('-');
          const dataBR = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

          return (
            <div key={evento.id} className={`item-evento-dashboard ${evento.tipo}`}>
              <div className="data">{dataBR}</div>
              <div className="info">
                <div className="titulo">
                  {isFolga ? evento.colaborador?.nome || 'Desconhecido' : evento.titulo}
                </div>
                <div className="subtitulo">
                  {isFolga ? `Motivo: ${evento.titulo}` : 'Evento Corporativo'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <CabecalhoPagina 
        titulo="Visão Geral Operacional"
        subtitulo="Acompanhe as métricas diárias e a agenda da equipe."
        trilha={[{ rotulo: 'Visão Geral' }]}
      />

      {(carregandoEventos || carregandoColab) ? (
        <p>Carregando painel...</p>
      ) : (
        <>
          {/* BANNER DE DESTAQUE - ACONTECIMENTOS DE HOJE */}
          <div className="banner-hoje">
            <h3>📋 Acontecimentos de Hoje</h3>
            
            {eventosDeHoje.length === 0 ? (
              <p style={{ color: '#cbd5e1', margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>Equipe completa. Nenhum evento ou folga agendada para hoje.</p>
            ) : (
              <div className="banner-lista">
                {eventosDeHoje.map(evento => (
                  <div key={evento.id} className={`banner-item ${evento.tipo}`}>
                    <div className="nome">
                      {evento.tipo === 'folga' ? evento.colaborador?.nome : evento.titulo}
                    </div>
                    <div className="motivo">
                      {evento.tipo === 'folga' ? `Motivo: ${evento.titulo}` : 'Evento Corporativo'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CARDS DE MÉTRICAS */}
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h4>Total de Colaboradores</h4>
              <div className="valor">{colaboradores.length}</div>
            </div>
            <div className="dashboard-card">
              <h4>Folgas (Este Mês)</h4>
              <div className="valor">{folgasEsteMes}</div>
            </div>
            <div className="dashboard-card">
              <h4>Alertas Hoje</h4>
              <div className="valor">{eventosDeHoje.length}</div>
            </div>
          </div>

          {/* SPLIT CONTAINER: AGENDA & MONITORAMENTO */}
          <div className="dashboard-split">
            <div className="dashboard-coluna">
              <h3 className="titulo-secao">Agenda de Ausências (15 Dias)</h3>
              {renderizarListaEventos(proximosEventos, 'Nenhuma ausência programada para as próximas semanas.')}
            </div>

            <div className="dashboard-coluna">
              <h3 className="titulo-secao">Monitoramento de Folgas ({anoAtualStr})</h3>
              {rankingFolgas.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>Nenhuma folga registrada neste ano.</p>
              ) : (
                <div className="lista-ranking">
                  {rankingFolgas.map((item, index) => (
                    <div key={item.id} className="item-ranking">
                      <div className="posicao">{index + 1}º</div>
                      <div className="nome-colab">
                        {item.nome}
                        <span style={{display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '400'}}>
                          {item.cargo}
                        </span>
                      </div>
                      <div className="badge-total">{item.totalFolgas} dias</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
