import React, { useState } from 'react';
import {
  RotateCw as IconeRecarregar,
  ExternalLink as IconeLinkExterno,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  UserX,
  CalendarCheck
} from 'lucide-react';
import { useEventos } from '../hooks/useEventos';
import {
  obterDiasDoMes,
  formatarData,
  nomesDosMeses,
  diasDaSemana
} from '../utils/dataUtils';
import logoAutoEscola from '../assets/LOGO_SJ.png';
import './WidgetAgenda.css';

export const WidgetAgenda = () => {
  const { eventos, carregando, recarregarEventos } = useEventos();
  const [estaAtualizandoManual, setEstaAtualizandoManual] = useState(false);
  const estaAtualizando = carregando || estaAtualizandoManual;
  const [abaAtiva, setAbaAtiva] = useState('mes'); // 'mes' ou 'proximos'

  const dataHoje = new Date();
  const hojeFormatado = formatarData(dataHoje);

  const [dataNavegacao, setDataNavegacao] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());

  const anoNavegacao = dataNavegacao.getFullYear();
  const mesNavegacao = dataNavegacao.getMonth();
  const diasDoMes = obterDiasDoMes(anoNavegacao, mesNavegacao);

  // Navegação entre meses
  const irParaMesAnterior = () => {
    setDataNavegacao(new Date(anoNavegacao, mesNavegacao - 1, 1));
  };

  const irParaProximoMes = () => {
    setDataNavegacao(new Date(anoNavegacao, mesNavegacao + 1, 1));
  };

  const voltarParaHoje = () => {
    const hoje = new Date();
    setDataNavegacao(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
    setDiaSelecionado(hoje);
  };

  // Recarga manual dos dados
  const lidarComRecarregar = async () => {
    if (estaAtualizandoManual) return;
    setEstaAtualizandoManual(true);
    try {
      if (recarregarEventos) {
        await recarregarEventos();
      }
    } finally {
      setTimeout(() => setEstaAtualizandoManual(false), 500);
    }
  };

  const abrirPainelWeb = () => {
    window.open('/', '_blank');
  };

  // Formatação de data amigável
  const formatarDataPorExtenso = (data) => {
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const formatarDataSimples = (dataIso) => {
    const [, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}`;
  };

  // Dados do dia selecionado
  const diaSelecionadoFormatado = formatarData(diaSelecionado);
  const ehHoje = diaSelecionadoFormatado === hojeFormatado;

  const eventosDoDiaSelecionado = eventos.filter(
    (evento) => evento.data === diaSelecionadoFormatado
  );

  const folgasDoDiaSelecionado = eventosDoDiaSelecionado.filter(
    (evento) => evento.tipo === 'folga'
  );

  const outrosEventosDoDiaSelecionado = eventosDoDiaSelecionado.filter(
    (evento) => evento.tipo !== 'folga'
  );

  // Próximos eventos a partir de hoje
  const proximosEventos = eventos
    .filter((evento) => evento.data >= hojeFormatado)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 12);

  return (
    <div className="widget-wrapper">
      <div className="widget-container">
        {/* Barra Superior */}
        <header className="widget-cabecalho">
          <div className="widget-marca">
            <div className="widget-logo-container">
              <img src={logoAutoEscola} alt="Auto Escola São João" className="widget-logo-img" />
            </div>
            <div className="widget-titulos">
              <span className="widget-titulo-principal">Auto Escola São João</span>
              <span className="widget-subtitulo-principal">Agenda da Equipe</span>
            </div>
          </div>

          <div className="widget-acoes-topo">
            <button
              type="button"
              className={`btn-widget-acao ${estaAtualizando ? 'girando' : ''}`}
              onClick={lidarComRecarregar}
              title="Recarregar informações"
            >
              <IconeRecarregar size={15} />
            </button>
            <button
              type="button"
              className="btn-widget-acao"
              onClick={abrirPainelWeb}
              title="Abrir painel administrativo completo"
            >
              <IconeLinkExterno size={15} />
            </button>
          </div>
        </header>

        {/* Header Dinâmico: Acontecimentos do Dia Selecionado */}
        <section className="widget-painel-dia-destaque">
          <div className="widget-painel-topo">
            <div className="widget-data-selecionada-titulo">
              <span>{formatarDataPorExtenso(diaSelecionado)}</span>
              {ehHoje && <span className="badge-dia-hoje">Hoje</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {!ehHoje && (
                <button
                  type="button"
                  className="btn-voltar-dia-hoje"
                  onClick={voltarParaHoje}
                  title="Voltar a ver o dia de hoje"
                >
                  Ver Hoje
                </button>
              )}
              <span
                className={`widget-tag-resumo ${
                  folgasDoDiaSelecionado.length > 0
                    ? 'com-folgas'
                    : outrosEventosDoDiaSelecionado.length > 0
                    ? 'com-eventos'
                    : 'sem-registros'
                }`}
              >
                {folgasDoDiaSelecionado.length > 0
                  ? `${folgasDoDiaSelecionado.length} ${
                      folgasDoDiaSelecionado.length === 1 ? 'folga' : 'folgas'
                    }`
                  : outrosEventosDoDiaSelecionado.length > 0
                  ? `${outrosEventosDoDiaSelecionado.length} ${
                      outrosEventosDoDiaSelecionado.length === 1 ? 'evento' : 'eventos'
                    }`
                  : 'Sem registros'}
              </span>
            </div>
          </div>

          {/* Lista de Acontecimentos do Dia Clicado */}
          <div className="widget-acontecimentos-lista">
            {eventosDoDiaSelecionado.length === 0 ? (
              <div className="widget-sem-acontecimentos">
                <CalendarCheck size={14} color="#64748b" />
                <span>
                  {ehHoje
                    ? 'Nenhuma folga ou evento hoje. Equipe completa!'
                    : 'Nenhum compromisso ou folga agendada para este dia.'}
                </span>
              </div>
            ) : (
              eventosDoDiaSelecionado.map((evento) => {
                const isFolga = evento.tipo === 'folga';
                return (
                  <div
                    key={evento.id}
                    className={`widget-acontecimento-item ${evento.tipo}`}
                  >
                    <div>
                      <div className="widget-acontecimento-nome">
                        {isFolga ? (
                          <>
                            <UserX size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {evento.colaborador?.nome || 'Colaborador'} (Folga)
                          </>
                        ) : (
                          evento.titulo
                        )}
                      </div>
                      <div className="widget-acontecimento-detalhe">
                        {isFolga ? `Motivo: ${evento.titulo}` : 'Compromisso da equipe'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Abas */}
        <div className="widget-abas">
          <button
            type="button"
            className={`btn-aba-widget ${abaAtiva === 'mes' ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva('mes')}
          >
            <CalendarDays size={15} />
            Mês
          </button>
          <button
            type="button"
            className={`btn-aba-widget ${abaAtiva === 'proximos' ? 'ativo' : ''}`}
            onClick={() => setAbaAtiva('proximos')}
          >
            <Clock size={15} />
            Próximos ({proximosEventos.length})
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <main className="widget-conteudo-aba">
          {abaAtiva === 'mes' ? (
            <>
              {/* Navegação do Mês */}
              <div className="widget-mes-nav">
                <span className="widget-mes-titulo">
                  {nomesDosMeses[mesNavegacao]} {anoNavegacao}
                </span>
                <div className="widget-mes-botoes">
                  <button
                    type="button"
                    className="btn-hoje-mini"
                    onClick={voltarParaHoje}
                    title="Ir para o mês atual"
                  >
                    Mês Atual
                  </button>
                  <button
                    type="button"
                    className="btn-nav-mini"
                    onClick={irParaMesAnterior}
                    title="Mês anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-nav-mini"
                    onClick={irParaProximoMes}
                    title="Próximo mês"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Grade do Calendário */}
              <div className="widget-calendario-grade">
                {diasDaSemana.map((dia) => (
                  <div key={dia} className="widget-dia-semana">
                    {dia[0]}
                  </div>
                ))}

                {diasDoMes.map((dia, index) => {
                  if (!dia) {
                    return <div key={`vazio-${index}`} className="widget-dia-celula vazio" />;
                  }

                  const diaIso = formatarData(dia);
                  const eventosDesteDia = eventos.filter((e) => e.data === diaIso);
                  const folgasDesteDia = eventosDesteDia.filter((e) => e.tipo === 'folga');
                  const temFolga = folgasDesteDia.length > 0;
                  const temEvento = eventosDesteDia.some((e) => e.tipo !== 'folga');
                  const ehDiaAtual = diaIso === hojeFormatado;
                  const ehDiaSelecionado = diaIso === diaSelecionadoFormatado;
                  const ehDomingo = dia.getDay() === 0;

                  return (
                    <div
                      key={diaIso}
                      className={`widget-dia-celula ${temFolga ? 'tem-folga' : ''} ${
                        temEvento ? 'tem-evento' : ''
                      } ${ehDiaAtual ? 'hoje' : ''} ${
                        ehDiaSelecionado ? 'selecionado' : ''
                      } ${ehDomingo ? 'domingo' : ''}`}
                      onClick={() => setDiaSelecionado(dia)}
                      title={
                        temFolga
                          ? `${dia.getDate()} - ${folgasDesteDia.length} ${
                              folgasDesteDia.length === 1 ? 'pessoa de folga' : 'pessoas de folga'
                            }`
                          : temEvento
                          ? `${dia.getDate()} - Dia com evento cadastrado`
                          : `${dia.getDate()}`
                      }
                    >
                      <span>{dia.getDate()}</span>
                      {folgasDesteDia.length > 1 && (
                        <span
                          className="widget-indicador-multi-folgas"
                          title={`${folgasDesteDia.length} pessoas de folga neste dia`}
                        >
                          {folgasDesteDia.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Aba Próximos Compromissos */
            <div className="widget-lista-proximos">
              {proximosEventos.length === 0 ? (
                <div className="widget-nenhum-registro">
                  Nenhum compromisso ou folga agendada para os próximos dias.
                </div>
              ) : (
                proximosEventos.map((evento) => {
                  const isFolga = evento.tipo === 'folga';
                  const ehEventoHoje = evento.data === hojeFormatado;

                  return (
                    <div
                      key={evento.id}
                      className={`widget-item-proximo ${evento.tipo}`}
                      onClick={() => {
                        const [ano, mes, dia] = evento.data.split('-').map(Number);
                        const dataEvento = new Date(ano, mes - 1, dia);
                        setDiaSelecionado(dataEvento);
                        setDataNavegacao(new Date(ano, mes - 1, 1));
                        setAbaAtiva('mes');
                      }}
                      style={{ cursor: 'pointer' }}
                      title="Clique para ver este dia no calendário"
                    >
                      <div>
                        <div className="widget-proximo-data-tag">
                          {ehEventoHoje ? 'Hoje' : formatarDataSimples(evento.data)}
                        </div>
                        <div className="widget-proximo-titulo">
                          {isFolga
                            ? evento.colaborador?.nome || 'Colaborador'
                            : evento.titulo}
                        </div>
                        <div className="widget-proximo-desc">
                          {isFolga ? `Folga: ${evento.titulo}` : 'Evento de equipe'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>

        {/* Rodapé Simples */}
        <footer className="widget-rodape">
          <span>Agenda • Auto Escola São João</span>
          <button type="button" className="link-painel-web" onClick={abrirPainelWeb}>
            Abrir Painel Completo <IconeLinkExterno size={12} />
          </button>
        </footer>
      </div>
    </div>
  );
};
