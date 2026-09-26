import { useEventos } from '../hooks/useEventos';
import { useColaboradores } from '../hooks/useColaboradores';
import { useTiposRegistro } from '../hooks/useTiposRegistro';
import { formatarData } from '../utils/dataUtils';
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

export const Dashboard = () => {
  const { eventos, carregando: carregandoEventos } = useEventos();
  const { colaboradores, carregando: carregandoColab } = useColaboradores();
  const { obterTipoPorChave } = useTiposRegistro();

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

  const verificarSeComputaAusencia = (e) => {
    if (ehEventoFerias(e)) return true;
    const info = obterTipoPorChave(e.tipo);
    if (info) return Boolean(info.computa_ausencia);
    return e.tipo === 'folga';
  };

  const folgasEsteMes = eventos.filter(e => {
    const anoEvento = e.data.substring(0, 4);
    const mesEvento = e.data.substring(5, 7);
    const anoAtual = String(dataHoje.getFullYear());
    const mesAtual = String(dataHoje.getMonth() + 1).padStart(2, '0');
    return verificarSeComputaAusencia(e) && anoEvento === anoAtual && mesEvento === mesAtual;
  }).length;

  const rankingFolgas = colaboradores.map(colaborador => {
    const totalFolgas = eventos.filter(e => 
      verificarSeComputaAusencia(e) && 
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
          const isFerias = ehEventoFerias(evento);
          const tipoInfo = obterTipoPorChave(evento.tipo);
          const temColaborador = Boolean(evento.colaborador?.nome);
          const classeTipo = isFerias ? 'ferias' : (tipoInfo?.chave || evento.tipo);
          const partesData = evento.data.split('-');
          const dataBR = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

          const estiloCustomizado = tipoInfo?.cor_hex ? {
            borderLeft: `4px solid ${tipoInfo.cor_hex}`,
            backgroundColor: hexParaRgba(tipoInfo.cor_hex, 0.08)
          } : undefined;

          return (
            <div
              key={evento.id}
              className={`item-evento-dashboard ${classeTipo}`}
              style={estiloCustomizado}
            >
              <div className="data">{dataBR}</div>
              <div className="info">
                <div className="titulo">
                  {isFerias
                    ? `${evento.colaborador?.nome || 'Desconhecido'} (Férias)`
                    : temColaborador
                    ? evento.colaborador?.nome
                    : evento.titulo}
                </div>
                <div className="subtitulo">
                  {isFerias
                    ? `Férias: ${evento.titulo}`
                    : temColaborador
                    ? `${tipoInfo?.nome ? `[${tipoInfo.nome}] ` : ''}${evento.titulo}`
                    : (tipoInfo?.nome || 'Evento Geral')}
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
                {eventosDeHoje.map(evento => {
                  const tipoInfo = obterTipoPorChave(evento.tipo);
                  const isFerias = ehEventoFerias(evento);
                  const temColaborador = Boolean(evento.colaborador?.nome);
                  const estiloBanner = tipoInfo?.cor_hex ? {
                    borderLeft: `3px solid ${tipoInfo.cor_hex}`
                  } : undefined;

                  return (
                    <div
                      key={evento.id}
                      className={`banner-item ${isFerias ? 'ferias' : (tipoInfo?.chave || evento.tipo)}`}
                      style={estiloBanner}
                    >
                      <div className="nome">
                        {isFerias
                          ? `${evento.colaborador?.nome} (Férias)`
                          : temColaborador
                          ? evento.colaborador?.nome
                          : evento.titulo}
                      </div>
                      <div className="motivo">
                        {isFerias
                          ? `Férias: ${evento.titulo}`
                          : temColaborador
                          ? `${tipoInfo?.nome ? `[${tipoInfo.nome}] ` : ''}${evento.titulo}`
                          : (tipoInfo?.nome || 'Evento Geral')}
                      </div>
                    </div>
                  );
                })}
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
