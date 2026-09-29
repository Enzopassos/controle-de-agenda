import React, { useState, useEffect } from 'react';
import {
  RotateCw as IconeRecarregar,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  UserX,
  CalendarCheck,
  Minus,
  X,
  Palmtree
} from 'lucide-react';
import { useEventos } from '../hooks/useEventos';
import { useTiposRegistro } from '../hooks/useTiposRegistro';
import { hexParaRgba } from '../utils/corUtils';
import {
  obterDiasDoMes,
  formatarData,
  nomesDosMeses,
  diasDaSemana
} from '../utils/dataUtils';
import logoAutoEscola from '../assets/LOGO_SJ.png';
import './WidgetAgenda.css';

const ehEventoFerias = (evento) => {
  if (!evento) return false;
  return (
    evento.tipo === 'ferias' ||
    (Boolean(evento.titulo) &&
      (evento.titulo.toLowerCase().includes('férias') || evento.titulo.toLowerCase().includes('ferias')))
  );
};

const ehAmbienteDesktop = typeof window !== 'undefined' && Boolean(
  window.__TAURI_INTERNALS__ ||
  window.__TAURI__ ||
  new URLSearchParams(window.location.search).get('desktop') === 'true'
);

export const WidgetAgenda = () => {
  const { eventos, carregando, recarregarEventos } = useEventos();
  const { obterTipoPorChave } = useTiposRegistro();
  const [estaAtualizandoManual, setEstaAtualizandoManual] = useState(false);
  const estaAtualizando = carregando || estaAtualizandoManual;
  const [abaAtiva, setAbaAtiva] = useState('mes'); // 'mes' ou 'proximos'

  useEffect(() => {
    document.body.classList.add('modo-widget-ativo');
    return () => {
      document.body.classList.remove('modo-widget-ativo');
    };
  }, []);

  const dataHoje = new Date();
  const hojeFormatado = formatarData(dataHoje);

  const [dataNavegacao, setDataNavegacao] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());

  const anoNavegacao = dataNavegacao.getFullYear();
  const mesNavegacao = dataNavegacao.getMonth();
  const diasDoMes = obterDiasDoMes(anoNavegacao, mesNavegacao);
  const ehMesAtual =
    anoNavegacao === dataHoje.getFullYear() &&
    mesNavegacao === dataHoje.getMonth();

  // Resolver informações e cor cadastrada do tipo de registro com prioridade de férias
  const resolverInformacoesTipo = (tipoChave, evento) => {
    const isFerias = ehEventoFerias(evento) || tipoChave === 'ferias';
    const chaveBusca = isFerias ? 'ferias' : (tipoChave || 'evento');
    const tipoCadastrado = obterTipoPorChave(chaveBusca);

    const nome =
      tipoCadastrado?.nome ||
      (isFerias ? 'Férias' : chaveBusca.charAt(0).toUpperCase() + chaveBusca.slice(1));
    const cor =
      tipoCadastrado?.cor_hex ||
      (isFerias ? '#f97316' : chaveBusca === 'folga' ? '#ef4444' : '#2563eb');
    const computaAusencia =
      isFerias || Boolean(tipoCadastrado?.computa_ausencia) || chaveBusca === 'folga';

    return {
      chave: chaveBusca,
      nome,
      cor,
      computaAusencia,
      isFerias,
    };
  };

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

  const lidarComMinimizar = async () => {
    try {
      if (ehAmbienteDesktop) {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().minimize();
      }
    } catch (erro) {
      console.error('Erro ao minimizar widget:', erro);
    }
  };

  const lidarComFechar = async () => {
    try {
      if (ehAmbienteDesktop) {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
      } else {
        window.close();
      }
    } catch (erro) {
      console.error('Erro ao fechar widget:', erro);
    }
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

  // Ordena os eventos do dia priorizando férias no topo da lista
  const eventosDoDiaSelecionado = eventos
    .filter((evento) => evento.data === diaSelecionadoFormatado)
    .sort((a, b) => {
      const ehFeriasA = ehEventoFerias(a);
      const ehFeriasB = ehEventoFerias(b);
      if (ehFeriasA && !ehFeriasB) return -1;
      if (!ehFeriasA && ehFeriasB) return 1;
      return 0;
    });

  const feriasDoDiaSelecionado = eventosDoDiaSelecionado.filter(
    (evento) => ehEventoFerias(evento)
  );

  const folgasDoDiaSelecionado = eventosDoDiaSelecionado.filter((evento) => {
    if (ehEventoFerias(evento)) return false;
    const info = obterTipoPorChave(evento.tipo);
    if (info) return Boolean(info.computa_ausencia);
    return evento.tipo === 'folga';
  });

  const outrosEventosDoDiaSelecionado = eventosDoDiaSelecionado.filter((evento) => {
    if (ehEventoFerias(evento)) return false;
    const info = obterTipoPorChave(evento.tipo);
    if (info) return !info.computa_ausencia;
    return evento.tipo !== 'folga';
  });

  // Próximos eventos a partir de hoje
  const proximosEventos = eventos
    .filter((evento) => evento.data >= hojeFormatado)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 12);

  return (
    <div className="widget-wrapper">
      <div className="widget-container">
        {/* Barra Superior / Header Arrastável (Drag Region) */}
        <header className="widget-cabecalho" data-tauri-drag-region>
          <div className="widget-marca" data-tauri-drag-region>
            <div className="widget-logo-container" data-tauri-drag-region>
              <img src={logoAutoEscola} alt="Auto Escola São João" className="widget-logo-img" data-tauri-drag-region />
            </div>
          </div>

          <div className="widget-acoes-topo">
            <button
              type="button"
              className={`btn-widget-acao ${estaAtualizando ? 'girando' : ''}`}
              onClick={lidarComRecarregar}
              title="Recarregar informações"
            >
              <IconeRecarregar size={14} />
            </button>
            {ehAmbienteDesktop && (
              <>
                <button
                  type="button"
                  className="btn-widget-acao"
                  onClick={lidarComMinimizar}
                  title="Minimizar janela flutuante"
                >
                  <Minus size={14} />
                </button>
                <button
                  type="button"
                  className="btn-widget-acao btn-fechar-widget"
                  onClick={lidarComFechar}
                  title="Fechar janela flutuante"
                >
                  <X size={14} />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Corpo Rolável do Widget com isolamento contra quebra de layout */}
        <div className="widget-corpo-scroll">
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
                  feriasDoDiaSelecionado.length > 0
                    ? 'com-ferias'
                    : folgasDoDiaSelecionado.length > 0
                    ? 'com-folgas'
                    : outrosEventosDoDiaSelecionado.length > 0
                    ? 'com-eventos'
                    : 'sem-registros'
                }`}
              >
                {feriasDoDiaSelecionado.length > 0
                  ? `${feriasDoDiaSelecionado.length} férias${
                      folgasDoDiaSelecionado.length > 0
                        ? ` (+${folgasDoDiaSelecionado.length} folga${folgasDoDiaSelecionado.length > 1 ? 's' : ''})`
                        : ''
                    }`
                  : folgasDoDiaSelecionado.length > 0
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
                const info = resolverInformacoesTipo(evento.tipo, evento);
                const isFerias = info.isFerias;
                const temColaborador = Boolean(evento.colaborador?.nome);
                const classeCss = isFerias ? 'ferias' : info.chave;

                const estiloItem = {
                  borderLeft: `3px solid ${info.cor}`,
                  backgroundColor: hexParaRgba(info.cor, 0.12),
                  color: '#1e293b'
                };

                return (
                  <div
                    key={evento.id}
                    className={`widget-acontecimento-item ${classeCss}`}
                    style={estiloItem}
                  >
                    <div>
                      <div className="widget-acontecimento-nome">
                        {isFerias ? (
                          <>
                            <Palmtree size={12} style={{ display: 'inline', marginRight: 4, color: info.cor }} />
                            {evento.colaborador?.nome || 'Funcionário'} (Férias)
                          </>
                        ) : temColaborador ? (
                          <>
                            <UserX size={12} style={{ display: 'inline', marginRight: 4, color: info.cor }} />
                            {evento.colaborador?.nome} {info.chave !== 'folga' ? `(${info.nome})` : '(Folga)'}
                          </>
                        ) : (
                          evento.titulo
                        )}
                      </div>
                      <div className="widget-acontecimento-detalhe">
                        {isFerias
                          ? `Período: ${evento.titulo}`
                          : temColaborador
                          ? `Motivo: ${evento.titulo}`
                          : info.nome}
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
                  {!ehMesAtual && (
                    <button
                      type="button"
                      className="btn-hoje-mini"
                      onClick={voltarParaHoje}
                      title="Ir para o mês atual"
                    >
                      Mês Atual
                    </button>
                  )}
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
                  const feriasDesteDia = eventosDesteDia.filter((e) => ehEventoFerias(e));
                  const ausenciasDesteDia = eventosDesteDia.filter((e) => {
                    if (ehEventoFerias(e)) return false;
                    const info = resolverInformacoesTipo(e.tipo, e);
                    return info.computaAusencia;
                  });
                  const totalAusenciasDesteDia = ausenciasDesteDia.length + feriasDesteDia.length;
                  const temFerias = feriasDesteDia.length > 0;
                  const temFolga = ausenciasDesteDia.length > 0;
                  const temEvento = eventosDesteDia.some((e) => {
                    if (ehEventoFerias(e)) return false;
                    const info = resolverInformacoesTipo(e.tipo, e);
                    return !info.computaAusencia;
                  });
                  const ehDiaAtual = diaIso === hojeFormatado;
                  const ehDiaSelecionado = diaIso === diaSelecionadoFormatado;
                  const ehDomingo = dia.getDay() === 0;

                  // PRIORIDADE ABSOLUTA: Se há férias no dia, a cor das férias se sobrepõe
                  let estiloDia = undefined;
                  if (temFerias) {
                    estiloDia = {
                      backgroundColor: '#ffedd5',
                      color: '#9a3412',
                      border: '1px solid #fed7aa',
                      fontWeight: 700,
                    };
                  } else if (temFolga) {
                    estiloDia = {
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      border: '1px solid #fca5a5',
                      fontWeight: 700,
                    };
                  } else if (temEvento) {
                    estiloDia = {
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                      fontWeight: 600,
                    };
                  }

                  return (
                    <div
                      key={diaIso}
                      className={`widget-dia-celula ${temFerias ? 'tem-ferias' : temFolga ? 'tem-folga' : ''} ${
                        temEvento ? 'tem-evento' : ''
                      } ${ehDiaAtual ? 'hoje' : ''} ${
                        ehDiaSelecionado ? 'selecionado' : ''
                      } ${ehDomingo ? 'domingo' : ''}`}
                      style={estiloDia}
                      onClick={() => setDiaSelecionado(dia)}
                      title={
                        temFerias
                          ? `${dia.getDate()} - ${feriasDesteDia.length} ${
                              feriasDesteDia.length === 1 ? 'pessoa de férias' : 'pessoas de férias'
                            }${ausenciasDesteDia.length > 0 ? ` (+${ausenciasDesteDia.length} folga${ausenciasDesteDia.length > 1 ? 's' : ''})` : ''}`
                          : temFolga
                          ? `${dia.getDate()} - ${ausenciasDesteDia.length} ${
                              ausenciasDesteDia.length === 1 ? 'pessoa ausente/folga' : 'pessoas ausentes/folga'
                            }`
                          : temEvento
                          ? `${dia.getDate()} - Dia com evento agendado`
                          : `${dia.getDate()}`
                      }
                    >
                      <span>{dia.getDate()}</span>
                      {totalAusenciasDesteDia > 1 && (
                        <span
                          className={`widget-indicador-multi-folgas ${temFerias ? 'com-ferias' : ''}`}
                          style={temFerias ? { backgroundColor: '#ea580c', borderColor: '#ffedd5' } : undefined}
                          title={`${totalAusenciasDesteDia} pessoas ausentes (folgas/férias) neste dia`}
                        >
                          {totalAusenciasDesteDia}
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
                  const info = resolverInformacoesTipo(evento.tipo, evento);
                  const isFerias = info.isFerias;
                  const temColaborador = Boolean(evento.colaborador?.nome);
                  const classeTipo = isFerias ? 'ferias' : info.chave;
                  const ehEventoHoje = evento.data === hojeFormatado;

                  const estiloProximo = {
                    borderLeft: `3px solid ${info.cor}`,
                    backgroundColor: hexParaRgba(info.cor, 0.08),
                  };

                  return (
                    <div
                      key={evento.id}
                      className={`widget-item-proximo ${classeTipo}`}
                      onClick={() => {
                        const [ano, mes, dia] = evento.data.split('-').map(Number);
                        const dataEvento = new Date(ano, mes - 1, dia);
                        setDiaSelecionado(dataEvento);
                        setDataNavegacao(new Date(ano, mes - 1, 1));
                        setAbaAtiva('mes');
                      }}
                      style={{ cursor: 'pointer', ...estiloProximo }}
                      title="Clique para ver este dia no calendário"
                    >
                      <div>
                        <div className="widget-proximo-data-tag">
                          {ehEventoHoje ? 'Hoje' : formatarDataSimples(evento.data)}
                        </div>
                        <div className="widget-proximo-titulo">
                          {isFerias ? (
                            <>
                              <Palmtree size={12} style={{ display: 'inline', marginRight: 4, color: info.cor }} />
                              {evento.colaborador?.nome || 'Funcionário'} (Férias)
                            </>
                          ) : temColaborador ? (
                            <>
                              <UserX size={12} style={{ display: 'inline', marginRight: 4, color: info.cor }} />
                              {evento.colaborador?.nome} {info.chave !== 'folga' ? `(${info.nome})` : ''}
                            </>
                          ) : (
                            evento.titulo
                          )}
                        </div>
                        <div className="widget-proximo-desc">
                          {isFerias
                            ? `Férias: ${evento.titulo}`
                            : temColaborador
                            ? `Motivo: ${evento.titulo}`
                            : info.nome}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>
        </div>

        {/* Rodapé Simples e Isolado */}
        <footer className="widget-rodape">
          <span>Agenda • Auto Escola São João</span>
        </footer>
      </div>
    </div>
  );
};
