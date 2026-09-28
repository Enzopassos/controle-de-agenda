import React, { useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Coffee,
  Activity,
  PieChart,
  BarChart3,
  Clock,
  Award,
  Inbox,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';
import { useEventos } from '../hooks/useEventos';
import { useColaboradores } from '../hooks/useColaboradores';
import { useTiposRegistro } from '../hooks/useTiposRegistro';
import { formatarData, nomesDosMeses } from '../utils/dataUtils';
import { hexParaRgba } from '../utils/corUtils';
import { CabecalhoPagina } from './CabecalhoPagina';
import './Dashboard.css';

/**
 * Função utilitária para verificar se um evento é de férias.
 */
const ehEventoFerias = (evento) => {
  if (!evento) return false;
  return (
    evento.tipo === 'ferias' ||
    (Boolean(evento.titulo) &&
      (evento.titulo.toLowerCase().includes('férias') ||
        evento.titulo.toLowerCase().includes('ferias')))
  );
};

/**
 * Extrai iniciais do nome de um colaborador para avatar.
 */
const obterIniciais = (nome) => {
  if (!nome) return 'CO';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

export const Dashboard = () => {
  const { eventos, carregando: carregandoEventos } = useEventos();
  const { colaboradores, carregando: carregandoColab } = useColaboradores();
  const { obterTipoPorChave } = useTiposRegistro();

  const dataHoje = useMemo(() => new Date(), []);
  const hojeStr = useMemo(() => formatarData(dataHoje), [dataHoje]);
  const anoAtualStr = useMemo(() => String(dataHoje.getFullYear()), [dataHoje]);
  const mesAtualStr = useMemo(() => String(dataHoje.getMonth() + 1).padStart(2, '0'), [dataHoje]);

  const daqui15DiasStr = useMemo(() => {
    const dataAlvo = new Date(dataHoje);
    dataAlvo.setDate(dataAlvo.getDate() + 15);
    return formatarData(dataAlvo);
  }, [dataHoje]);

  // Função para resolver o objeto completo do tipo de registro e sua cor oficial cadastrada
  const resolverInformacoesTipo = useMemo(() => {
    return (tipoChave, evento) => {
      const isFerias = ehEventoFerias(evento) || tipoChave === 'ferias';
      const chaveBusca = isFerias ? 'ferias' : (tipoChave || 'evento');
      const tipoCadastrado = obterTipoPorChave(chaveBusca);

      const nome = tipoCadastrado?.nome || (isFerias ? 'Férias' : chaveBusca.charAt(0).toUpperCase() + chaveBusca.slice(1));
      const cor = tipoCadastrado?.cor_hex || (isFerias ? '#f97316' : (chaveBusca === 'folga' ? '#ef4444' : '#2563eb'));
      const computaAusencia = isFerias || Boolean(tipoCadastrado?.computa_ausencia) || chaveBusca === 'folga';

      return {
        chave: chaveBusca,
        nome,
        cor,
        computaAusencia,
      };
    };
  }, [obterTipoPorChave]);

  // Verificação se computa ausência
  const verificarSeComputaAusencia = useMemo(() => {
    return (e) => {
      if (!e) return false;
      return resolverInformacoesTipo(e.tipo, e).computaAusencia;
    };
  }, [resolverInformacoesTipo]);

  // Eventos de Hoje e Ausências de Hoje
  const eventosDeHoje = useMemo(() => {
    return eventos.filter((e) => e.data === hojeStr);
  }, [eventos, hojeStr]);

  const ausenciasHoje = useMemo(() => {
    return eventosDeHoje.filter(verificarSeComputaAusencia);
  }, [eventosDeHoje, verificarSeComputaAusencia]);

  // Próximos 15 dias
  const proximosEventos = useMemo(() => {
    return eventos
      .filter((e) => e.data > hojeStr && e.data <= daqui15DiasStr)
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [eventos, hojeStr, daqui15DiasStr]);

  // Contagem do mês
  const folgasEsteMes = useMemo(() => {
    return eventos.filter((e) => {
      const anoEvento = e.data?.substring(0, 4);
      const mesEvento = e.data?.substring(5, 7);
      return (
        verificarSeComputaAusencia(e) &&
        anoEvento === anoAtualStr &&
        mesEvento === mesAtualStr
      );
    }).length;
  }, [eventos, anoAtualStr, mesAtualStr, verificarSeComputaAusencia]);

  // Ranking de ausências por colaborador no ano
  const rankingFolgas = useMemo(() => {
    return colaboradores
      .map((colaborador) => {
        const totalFolgas = eventos.filter(
          (e) =>
            verificarSeComputaAusencia(e) &&
            e.colaborador_id === colaborador.id &&
            e.data?.startsWith(anoAtualStr)
        ).length;
        return { ...colaborador, totalFolgas };
      })
      .filter((c) => c.totalFolgas > 0)
      .sort((a, b) => b.totalFolgas - a.totalFolgas);
  }, [colaboradores, eventos, verificarSeComputaAusencia, anoAtualStr]);

  const maxFolgasRanking = rankingFolgas.length > 0 ? rankingFolgas[0].totalFolgas : 1;

  // Taxa de disponibilidade operacional hoje
  const totalColaboradores = colaboradores.length;
  const taxaDisponibilidade = totalColaboradores > 0
    ? Math.max(0, Math.round(((totalColaboradores - ausenciasHoje.length) / totalColaboradores) * 100))
    : 100;

  // Dados para o Gráfico Donut (100% Cores e Nomes Cadastrados no Banco)
  const dadosDonut = useMemo(() => {
    const contagemPorTipo = {};

    eventos.forEach((e) => {
      const info = resolverInformacoesTipo(e.tipo, e);
      contagemPorTipo[info.chave] = (contagemPorTipo[info.chave] || 0) + 1;
    });

    const total = eventos.length;
    if (total === 0) return { itens: [], segmentos: [], total: 0 };

    const itens = Object.entries(contagemPorTipo)
      .map(([chave, quantidade]) => {
        const info = resolverInformacoesTipo(chave, null);
        const porcentagem = (quantidade / total) * 100;

        return {
          chave,
          nome: info.nome,
          quantidade,
          porcentagem,
          cor: info.cor, // Cor cadastrada do tipo de registro
        };
      })
      .sort((a, b) => b.quantidade - a.quantidade);

    // Segmentos do SVG Donut
    const raio = 58;
    const circunferencia = 2 * Math.PI * raio; // ~364.42
    let deslocamentoAcumulado = 0;

    const segmentos = itens.map((item) => {
      const comprimentoSegmento = (item.porcentagem / 100) * circunferencia;
      const strokeDasharray = `${comprimentoSegmento} ${circunferencia - comprimentoSegmento}`;
      const strokeDashoffset = -deslocamentoAcumulado;
      deslocamentoAcumulado += comprimentoSegmento;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
      };
    });

    return { itens, segmentos, total };
  }, [eventos, resolverInformacoesTipo]);

  // Dados para o Gráfico de Barras (Últimos 6 Meses)
  const dadosBarrasMeses = useMemo(() => {
    const meses = [];
    const hoje = new Date();

    for (let i = 5; i >= 0; i--) {
      const dataAlvo = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const anoStr = String(dataAlvo.getFullYear());
      const mesStr = String(dataAlvo.getMonth() + 1).padStart(2, '0');
      const prefixo = `${anoStr}-${mesStr}`;
      const rotuloMes = nomesDosMeses[dataAlvo.getMonth()].slice(0, 3);

      const eventosDoMes = eventos.filter((e) => e.data && e.data.startsWith(prefixo));
      const ausencias = eventosDoMes.filter(verificarSeComputaAusencia).length;
      const gerais = Math.max(0, eventosDoMes.length - ausencias);

      meses.push({
        chave: prefixo,
        rotulo: rotuloMes,
        gerais,
        ausencias,
        total: eventosDoMes.length,
      });
    }

    return meses;
  }, [eventos, verificarSeComputaAusencia]);

  const valorMaximoBarras = useMemo(() => {
    let max = 6;
    dadosBarrasMeses.forEach((m) => {
      if (m.gerais > max) max = m.gerais;
      if (m.ausencias > max) max = m.ausencias;
    });
    return max * 1.18;
  }, [dadosBarrasMeses]);

  // Saudação e Data por Extenso
  const obterSaudacao = () => {
    const hora = dataHoje.getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatarDataPorExtenso = (data) => {
    const diasSemana = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    const diaSemana = diasSemana[data.getDay()];
    const dia = data.getDate();
    const mesNome = nomesDosMeses[data.getMonth()].toLowerCase();
    const ano = data.getFullYear();
    return `${diaSemana}, ${dia} de ${mesNome} de ${ano}`;
  };

  return (
    <div className="dashboard-container">
      {/* Cabeçalho de Navegação e Contexto Padronizado */}
      <CabecalhoPagina
        icone={LayoutDashboard}
        titulo="Painel Operacional"
        subtitulo="Visão integrada de escalas, funcionários e agendamentos em tempo real."
      />

      {(carregandoEventos || carregandoColab) ? (
        <div className="dashboard-vazio-box">
          <Clock size={32} className="icone-girando" style={{ color: 'var(--cor-acao, #2563eb)' }} />
          <p>Carregando métricas e indicadores operacionais...</p>
        </div>
      ) : (
        <>
          {/* ==================================================================== */}
          {/* 1. BANNER EXECUTIVO DE SAUDAÇÃO & STATUS DO DIA                      */}
          {/* ==================================================================== */}
          <section className="dashboard-banner-saudacao" aria-label="Status do Dia">
            <div className="banner-topo-flex">
              <div className="banner-titulos">
                <span className="banner-data-hoje">{formatarDataPorExtenso(dataHoje)}</span>
                <h2 className="banner-saudacao-texto">
                  {obterSaudacao()}, Gestor(a)!
                </h2>
                <p className="banner-subtexto">
                  {ausenciasHoje.length === 0
                    ? 'A autoescola está com operação 100% ativa e todos os funcionários escalados disponíveis.'
                    : `Há ${ausenciasHoje.length} ausência(s) registrada(s) para a data de hoje. Confira a equipe disponível.`}
                </p>
              </div>

              {/* Status Operacional */}
              <div className="banner-status-box">
                <span
                  className={`banner-status-dot ${ausenciasHoje.length > 0 ? 'atencao' : ''}`}
                  aria-hidden="true"
                />
                <div className="banner-status-info">
                  <span className="banner-status-rotulo">Status da Equipe</span>
                  <span className="banner-status-valor">
                    {totalColaboradores - ausenciasHoje.length} de {totalColaboradores} ativos hoje
                  </span>
                </div>
              </div>
            </div>

            {/* Acontecimentos / Ausências de Hoje */}
            <div className="banner-eventos-hoje-bloco">
              <div className="banner-eventos-hoje-titulo">Acontecimentos de Hoje</div>
              {eventosDeHoje.length === 0 ? (
                <div className="banner-evento-chip">
                  <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                  <span>Nenhuma folga ou ausência programada para hoje. Equipe completa.</span>
                </div>
              ) : (
                <div className="banner-eventos-hoje-lista">
                  {eventosDeHoje.map((evento) => {
                    const info = resolverInformacoesTipo(evento.tipo, evento);
                    const nomeColab = evento.colaborador?.nome || evento.titulo;

                    return (
                      <div key={evento.id} className="banner-evento-chip">
                        <span
                          className="banner-evento-chip-tipo"
                          style={{
                            backgroundColor: info.cor,
                            color: '#FFFFFF',
                          }}
                        >
                          {info.nome}
                        </span>
                        <strong>{nomeColab}</strong>
                        {evento.observacao && <span>— {evento.observacao}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ==================================================================== */}
          {/* 2. CARDS DE MÉTRICAS OPERACIONAIS (KPIs)                             */}
          {/* ==================================================================== */}
          <section className="dashboard-kpi-grid" aria-label="Métricas Principais">
            {/* Card 1: Equipe Total */}
            <article className="dashboard-kpi-card">
              <div className="kpi-topo">
                <span className="kpi-rotulo">Equipe Cadastrada</span>
                <div className="kpi-icone-box azul">
                  <Users size={20} />
                </div>
              </div>
              <div className="kpi-valor-bloco">
                <span className="kpi-valor">{totalColaboradores}</span>
                <span className="kpi-unidade">colaboradores</span>
              </div>
              <div className="kpi-rodape-info">
                <span>Funcionários cadastrados na equipe</span>
              </div>
            </article>

            {/* Card 2: Atividades Hoje */}
            <article className="dashboard-kpi-card">
              <div className="kpi-topo">
                <span className="kpi-rotulo">Atividades Hoje</span>
                <div className="kpi-icone-box indigo">
                  <CalendarDays size={20} />
                </div>
              </div>
              <div className="kpi-valor-bloco">
                <span className="kpi-valor">{eventosDeHoje.length}</span>
                <span className="kpi-unidade">registros</span>
              </div>
              <div className="kpi-rodape-info">
                <span>Eventos agendados para a data atual</span>
              </div>
            </article>

            {/* Card 3: Ausências no Mês */}
            <article className="dashboard-kpi-card">
              <div className="kpi-topo">
                <span className="kpi-rotulo">Ausências no Mês</span>
                <div className="kpi-icone-box vermelho">
                  <Coffee size={20} />
                </div>
              </div>
              <div className="kpi-valor-bloco">
                <span className="kpi-valor">{folgasEsteMes}</span>
                <span className="kpi-unidade">dias</span>
              </div>
              <div className="kpi-rodape-info">
                <span>Folgas e períodos de férias computados</span>
              </div>
            </article>

            {/* Card 4: Taxa de Disponibilidade */}
            <article className="dashboard-kpi-card">
              <div className="kpi-topo">
                <span className="kpi-rotulo">Disponibilidade Hoje</span>
                <div className="kpi-icone-box verde">
                  <Activity size={20} />
                </div>
              </div>
              <div className="kpi-valor-bloco">
                <span className="kpi-valor">{taxaDisponibilidade}%</span>
                <span className="kpi-unidade">operacional</span>
              </div>
              <div className="kpi-rodape-info">
                <span>Capacidade de atendimento da equipe</span>
              </div>
            </article>
          </section>

          {/* ==================================================================== */}
          {/* 3. GRÁFICOS ANALÍTICOS (DONUT + BARRAS NATIVOS EM SVG)               */}
          {/* ==================================================================== */}
          <section className="dashboard-graficos-grid" aria-label="Gráficos Analíticos">
            {/* Gráfico 1: Distribuição por Tipo de Registro (Donut com Cores Oficiais) */}
            <article className="card-grafico-dashboard">
              <div className="grafico-cabecalho">
                <div className="grafico-titulo-grupo">
                  <div className="grafico-icone-header">
                    <PieChart size={18} />
                  </div>
                  <div>
                    <h3 className="grafico-titulo">Distribuição por Categoria</h3>
                    <p className="grafico-subtitulo">Cores oficiais dos tipos de registro do sistema</p>
                  </div>
                </div>
              </div>

              {dadosDonut.total === 0 ? (
                <div className="dashboard-vazio-box">
                  <Inbox size={32} />
                  <p>Nenhum registro encontrado para gerar a distribuição.</p>
                </div>
              ) : (
                <div className="donut-layout-container">
                  {/* SVG Donut */}
                  <div className="donut-svg-wrapper">
                    <svg viewBox="0 0 160 160" className="donut-svg" aria-hidden="true">
                      {/* Trilha base de fundo */}
                      <circle
                        cx="80"
                        cy="80"
                        r="58"
                        fill="none"
                        stroke="#F1F5F9"
                        strokeWidth="18"
                        className="donut-circulo-base"
                      />

                      {/* Segmentos coloridos com as cores dos registros */}
                      {dadosDonut.segmentos.map((seg, idx) => (
                        <circle
                          key={`${seg.chave}-${idx}`}
                          cx="80"
                          cy="80"
                          r="58"
                          fill="none"
                          stroke={seg.cor}
                          strokeWidth="18"
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          className="donut-segmento"
                        />
                      ))}
                    </svg>

                    {/* Centro Informativo */}
                    <div className="donut-centro-info">
                      <span className="donut-centro-rotulo">Total</span>
                      <span className="donut-centro-total">{dadosDonut.total}</span>
                    </div>
                  </div>

                  {/* Lista de Legendas com Barras de Proporção nas Cores Oficiais */}
                  <div className="donut-legendas-lista">
                    {dadosDonut.itens.map((item) => (
                      <div key={item.chave} className="donut-legenda-item">
                        <div className="donut-legenda-topo">
                          <div className="donut-legenda-nome">
                            <span
                              className="donut-ponto-cor"
                              style={{ backgroundColor: item.cor }}
                            />
                            <span>{item.nome}</span>
                          </div>
                          <span className="donut-legenda-valores">
                            {item.quantidade} ({item.porcentagem.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="donut-barra-trilho">
                          <div
                            className="donut-barra-preenchimento"
                            style={{
                              width: `${item.porcentagem}%`,
                              backgroundColor: item.cor,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Gráfico 2: Volume Mensal (Barras dos Últimos 6 Meses com Cores Sólidas) */}
            <article className="card-grafico-dashboard">
              <div className="grafico-cabecalho">
                <div className="grafico-titulo-grupo">
                  <div className="grafico-icone-header">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <h3 className="grafico-titulo">Histórico Recente</h3>
                    <p className="grafico-subtitulo">Eventos gerais vs. ausências nos últimos 6 meses</p>
                  </div>
                </div>

                <div className="barras-legenda-topo">
                  <div className="item-legenda-barras">
                    <span className="dot-legenda-azul" />
                    <span>Gerais</span>
                  </div>
                  <div className="item-legenda-barras">
                    <span className="dot-legenda-vermelho" />
                    <span>Ausências</span>
                  </div>
                </div>
              </div>

              <div className="barras-grafico-container">
                {dadosBarrasMeses.map((mes) => {
                  const alturaGeraisPct = Math.max(
                    6,
                    (mes.gerais / valorMaximoBarras) * 100
                  );
                  const alturaAusenciasPct = Math.max(
                    6,
                    (mes.ausencias / valorMaximoBarras) * 100
                  );

                  return (
                    <div key={mes.chave} className="coluna-mes-grupo">
                      <div className="coluna-mes-barras">
                        <div
                          className="barra-grafico geral"
                          style={{ height: `${alturaGeraisPct}%` }}
                          title={`Gerais (${mes.rotulo}): ${mes.gerais}`}
                        />
                        <div
                          className="barra-grafico ausencia"
                          style={{ height: `${alturaAusenciasPct}%` }}
                          title={`Ausências (${mes.rotulo}): ${mes.ausencias}`}
                        />
                      </div>
                      <span className="coluna-mes-rotulo">{mes.rotulo}</span>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          {/* ==================================================================== */}
          {/* 4. SEÇÃO OPERACIONAL DIVIDIDA (AGENDA 15 DIAS + RANKING ANUAL)       */}
          {/* ==================================================================== */}
          <section className="dashboard-operacional-grid" aria-label="Operações e Escalas">
            {/* Coluna 1: Timeline dos Próximos 15 Dias */}
            <article className="card-operacional">
              <div className="card-operacional-cabecalho">
                <div className="card-operacional-titulo-box">
                  <CalendarCheck size={18} style={{ color: '#2563eb' }} />
                  <h3 className="card-operacional-titulo">Próximos Acontecimentos (15 Dias)</h3>
                </div>
                <span className="card-operacional-badge-qtd">
                  {proximosEventos.length} agendados
                </span>
              </div>

              {proximosEventos.length === 0 ? (
                <div className="dashboard-vazio-box">
                  <Inbox size={32} />
                  <p>Nenhuma ausência ou evento programado para as próximas semanas.</p>
                </div>
              ) : (
                <div className="timeline-eventos-lista">
                  {proximosEventos.map((evento) => {
                    const info = resolverInformacoesTipo(evento.tipo, evento);
                    const partesData = evento.data ? evento.data.split('-') : ['2026', '01', '01'];
                    const dia = partesData[2];
                    const mesIndex = parseInt(partesData[1], 10) - 1;
                    const mesAbrev = nomesDosMeses[mesIndex] ? nomesDosMeses[mesIndex].slice(0, 3) : 'Mês';

                    const nomeColaborador = evento.colaborador?.nome || evento.titulo || 'Geral';

                    return (
                      <div key={evento.id} className="timeline-item-evento">
                        {/* Chip da Data */}
                        <div className="timeline-data-badge">
                          <span className="timeline-dia">{dia}</span>
                          <span className="timeline-mes">{mesAbrev}</span>
                        </div>

                        {/* Avatar com cor oficial do tipo de registro */}
                        <div
                          className="timeline-colab-avatar"
                          style={{ backgroundColor: info.cor }}
                        >
                          {obterIniciais(nomeColaborador)}
                        </div>

                        {/* Informações */}
                        <div className="timeline-info-bloco">
                          <span className="timeline-nome-colab">{nomeColaborador}</span>
                          <span className="timeline-descricao-evento">
                            {evento.titulo}
                          </span>
                        </div>

                        {/* Tag de Tipo com a cor oficial cadastrada */}
                        <span
                          className="timeline-tipo-tag"
                          style={{
                            backgroundColor: hexParaRgba(info.cor, 0.12),
                            color: info.cor,
                          }}
                        >
                          {info.nome}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            {/* Coluna 2: Monitoramento & Ranking de Folgas Anual (100% Sólido) */}
            <article className="card-operacional">
              <div className="card-operacional-cabecalho">
                <div className="card-operacional-titulo-box">
                  <Award size={18} style={{ color: '#0f172a' }} />
                  <h3 className="card-operacional-titulo">Monitoramento de Escalas ({anoAtualStr})</h3>
                </div>
                <span className="card-operacional-badge-qtd">
                  {rankingFolgas.length} colaboradores
                </span>
              </div>

              {rankingFolgas.length === 0 ? (
                <div className="dashboard-vazio-box">
                  <Inbox size={32} />
                  <p>Nenhuma folga ou ausência registrada neste ano.</p>
                </div>
              ) : (
                <div className="ranking-folgas-lista">
                  {rankingFolgas.map((item, index) => {
                    const porcentagem = Math.max(8, Math.round((item.totalFolgas / maxFolgasRanking) * 100));
                    const classePosicao =
                      index === 0 ? 'primeiro' : index === 1 ? 'segundo' : index === 2 ? 'terceiro' : '';

                    return (
                      <div key={item.id} className="ranking-item-colab">
                        <div className="ranking-item-topo">
                          <div className="ranking-colab-bloco">
                            <span className={`ranking-posicao-badge ${classePosicao}`}>
                              {index + 1}º
                            </span>
                            <div>
                              <span className="ranking-colab-nome">{item.nome}</span>
                              {item.cargo && (
                                <span className="ranking-colab-cargo"> — {item.cargo}</span>
                              )}
                            </div>
                          </div>
                          <span className="ranking-dias-badge">
                            {item.totalFolgas} {item.totalFolgas === 1 ? 'dia' : 'dias'}
                          </span>
                        </div>

                        <div className="ranking-trilho-progresso">
                          {/* Barra de progresso 100% cor sólida, sem degradê */}
                          <div
                            className="ranking-barra-preenchimento"
                            style={{ width: `${porcentagem}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
};
