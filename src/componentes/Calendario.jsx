import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Palmtree,
  Users,
} from 'lucide-react';
import { obterDiasDoMes, formatarData, nomesDosMeses, diasDaSemana } from '../utils/dataUtils';
import { useEventos } from '../hooks/useEventos';
import { useTiposRegistro } from '../hooks/useTiposRegistro';
import { useColaboradores } from '../hooks/useColaboradores';
import { hexParaRgba } from '../utils/corUtils';
import { ModalDeEvento } from './ModalDeEvento';
import { ModalDeFerias } from './ModalDeFerias';
import { ModalConfirmacaoExclusao } from './ModalConfirmacaoExclusao';
import { CabecalhoPagina } from './CabecalhoPagina';
import { ErrorBoundary } from './ErrorBoundary';
import './Calendario.css';

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

export const Calendario = () => {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  // Filtros rápidos
  const [filtroColaboradorId, setFiltroColaboradorId] = useState('');
  const [filtroTipoChave, setFiltroTipoChave] = useState('');

  // Estados dos modais
  const [modalMesesAberto, setModalMesesAberto] = useState(false);
  const [modalFeriasAberto, setModalFeriasAberto] = useState(false);
  const [anoSelecionadoModal, setAnoSelecionadoModal] = useState(new Date().getFullYear());
  const [eventoParaExcluir, setEventoParaExcluir] = useState(null);

  const { eventos, adicionarEvento, adicionarVariosEventos, removerEvento } = useEventos();
  const { tipos, obterTipoPorChave } = useTiposRegistro();
  const { colaboradores } = useColaboradores();

  const dataHoje = useMemo(() => new Date(), []);
  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const dias = useMemo(() => obterDiasDoMes(ano, mes), [ano, mes]);

  const irParaMesAnterior = () => setDataAtual(new Date(ano, mes - 1, 1));
  const irParaProximoMes = () => setDataAtual(new Date(ano, mes + 1, 1));
  const voltarParaHoje = () => setDataAtual(new Date(dataHoje.getFullYear(), dataHoje.getMonth(), 1));

  // Verifica se não estamos no mês atual para exibir o botão
  const mostrarBotaoHoje = ano !== dataHoje.getFullYear() || mes !== dataHoje.getMonth();

  // Resolver informações e cor cadastrada do tipo de registro
  const resolverInformacoesTipo = useMemo(() => {
    return (tipoChave, evento) => {
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
      };
    };
  }, [obterTipoPorChave]);

  // Aplicação dos filtros em tempo real
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      if (filtroColaboradorId && e.colaborador_id !== filtroColaboradorId) {
        return false;
      }
      if (filtroTipoChave) {
        const info = resolverInformacoesTipo(e.tipo, e);
        if (info.chave !== filtroTipoChave) {
          return false;
        }
      }
      return true;
    });
  }, [eventos, filtroColaboradorId, filtroTipoChave, resolverInformacoesTipo]);

  // Contagem de eventos por tipo no mês atual visível (para exibir na legenda)
  const contagemTiposMesAtual = useMemo(() => {
    const mesStr = String(mes + 1).padStart(2, '0');
    const prefixoMes = `${ano}-${mesStr}`;
    const contagem = {};

    eventos.forEach((e) => {
      if (e.data && e.data.startsWith(prefixoMes)) {
        const info = resolverInformacoesTipo(e.tipo, e);
        contagem[info.chave] = (contagem[info.chave] || 0) + 1;
      }
    });

    return contagem;
  }, [eventos, ano, mes, resolverInformacoesTipo]);

  const obterEventosDoDia = (dia) => {
    if (!dia) return [];
    const dataStr = formatarData(dia);
    return eventosFiltrados.filter((evento) => evento.data === dataStr);
  };

  const selecionarMesNoModal = (indiceMes) => {
    setDataAtual(new Date(anoSelecionadoModal, indiceMes, 1));
    setModalMesesAberto(false);
  };

  const lidarComConfirmacaoExclusaoEvento = async () => {
    if (!eventoParaExcluir) return;
    try {
      await removerEvento(eventoParaExcluir.id);
    } catch (erro) {
      console.error('Erro ao remover agendamento do calendário:', erro);
    } finally {
      setEventoParaExcluir(null);
    }
  };

  return (
    <div className="calendario-wrapper">
      {/* Cabeçalho de Navegação e Contexto da Página Padronizado */}
      <CabecalhoPagina
        icone={CalendarDays}
        titulo="Calendário de Agendamentos"
        subtitulo="Gestão de escalas, aulas práticas e ausências da equipe com cores oficiais."
        acoes={
          <button
            type="button"
            className="btn-lancar-ferias-solido"
            onClick={() => setModalFeriasAberto(true)}
            title="Lançar período de férias de um colaborador"
          >
            <Palmtree size={16} />
            <span>Lançar Férias</span>
          </button>
        }
      />

      {/* Card Principal da Grade do Calendário */}
      <div className="calendario-card-principal">
        {/* Barra Superior de Controles: Navegação de Mês & Filtro de Colaborador */}
        <div className="calendario-barra-controles-mes">
          <div className="navegacao-mes-controles">
            <button
              type="button"
              className="btn-navegacao-mes"
              onClick={irParaMesAnterior}
              title="Mês Anterior"
              aria-label="Mês Anterior"
            >
              <ChevronLeft size={20} />
            </button>

            <div
              className="titulo-mes-seletor"
              onClick={() => {
                setAnoSelecionadoModal(ano);
                setModalMesesAberto(true);
              }}
              title="Clique para alternar o mês e ano rapidamente"
            >
              <span className="titulo-mes-texto">
                {nomesDosMeses[mes]} {ano}
              </span>
            </div>

            <button
              type="button"
              className="btn-navegacao-mes"
              onClick={irParaProximoMes}
              title="Próximo Mês"
              aria-label="Próximo Mês"
            >
              <ChevronRight size={20} />
            </button>

            {mostrarBotaoHoje && (
              <button
                type="button"
                className="btn-mes-atual-solido"
                onClick={voltarParaHoje}
                title="Voltar para o mês corrente"
              >
                Mês Atual
              </button>
            )}
          </div>

          <div className="ferramenta-filtro-bloco">
            <label className="ferramenta-rotulo" htmlFor="filtro-colaborador-select">
              <Users size={16} />
              <span>Instrutor:</span>
            </label>
            <select
              id="filtro-colaborador-select"
              className="select-filtro-colaborador"
              value={filtroColaboradorId}
              onChange={(e) => setFiltroColaboradorId(e.target.value)}
            >
              <option value="">Todos os Instrutores / Equipe</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.cargo ? `(${c.cargo})` : ''}
                </option>
              ))}
            </select>

            {(filtroColaboradorId || filtroTipoChave) && (
              <button
                type="button"
                className="btn-limpar-filtros"
                onClick={() => {
                  setFiltroColaboradorId('');
                  setFiltroTipoChave('');
                }}
                title="Limpar filtros"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Barra de Ferramentas: Legenda Oficial e Filtro Rápido */}
        <div className="calendario-barra-ferramentas">
          <div className="legenda-tipos-grade" role="region" aria-label="Legenda de tipos de registro">
            {tipos.map((tipo) => {
              const estaAtivo = filtroTipoChave === tipo.chave;
              const quantidade = contagemTiposMesAtual[tipo.chave] || 0;

              return (
                <button
                  key={tipo.chave}
                  type="button"
                  className={`chip-legenda-tipo ${estaAtivo ? 'ativo' : ''}`}
                  onClick={() =>
                    setFiltroTipoChave(estaAtivo ? '' : tipo.chave)
                  }
                  title={`Clique para filtrar apenas registros de ${tipo.nome}`}
                >
                  <span
                    className="ponto-legenda-cor"
                    style={{ backgroundColor: tipo.cor_hex }}
                  />
                  <span>{tipo.nome}</span>
                  {quantidade > 0 && (
                    <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>({quantidade})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grade Mensal */}
        <div className="calendario-grade-mensal">
          {diasDaSemana.map((diaSemana) => (
            <div key={diaSemana} className="cabecalho-dia-semana">
              {diaSemana}
            </div>
          ))}

          {dias.map((dia, index) => {
            const eventosDesteDia = obterEventosDoDia(dia);
            const isDomingo = dia && dia.getDay() === 0;

            // Verifica se este dia é o dia de hoje
            const ehHoje =
              dia &&
              dia.getDate() === dataHoje.getDate() &&
              dia.getMonth() === dataHoje.getMonth() &&
              dia.getFullYear() === dataHoje.getFullYear();

            // Total de ausências computadas neste dia
            const ausenciasDesteDia = eventosDesteDia.filter(
              (e) => resolverInformacoesTipo(e.tipo, e).computaAusencia
            );

            // Ordena eventos priorizando férias no topo
            const eventosOrdenados = [...eventosDesteDia].sort((a, b) => {
              const ehFeriasA = ehEventoFerias(a);
              const ehFeriasB = ehEventoFerias(b);
              if (ehFeriasA && !ehFeriasB) return -1;
              if (!ehFeriasA && ehFeriasB) return 1;
              return 0;
            });

            return (
              <div
                key={index}
                className={`dia-celula-grade ${!dia ? 'vazio' : ''} ${
                  isDomingo ? 'domingo' : ''
                } ${ehHoje ? 'hoje' : ''}`}
                onClick={() => dia && setDiaSelecionado(dia)}
              >
                {/* Cabeçalho da Célula (Número do dia e contador) */}
                <div className="dia-celula-topo">
                  {ausenciasDesteDia.length > 1 && (
                    <span className="badge-resumo-ausencias">
                      {ausenciasDesteDia.length} ausências
                    </span>
                  )}
                  {dia && <span className="dia-numero-texto">{dia.getDate()}</span>}
                </div>

                {/* Lista de Badges de Eventos na Célula */}
                <div className="dia-celula-lista-eventos">
                  {eventosOrdenados.map((evento) => {
                    const info = resolverInformacoesTipo(evento.tipo, evento);
                    const temColaborador = Boolean(evento.colaborador?.nome);
                    const nomeExibicao = temColaborador
                      ? evento.colaborador.nome
                      : evento.titulo;

                    return (
                      <div
                        key={evento.id}
                        className="badge-evento-celula"
                        style={{
                          backgroundColor: hexParaRgba(info.cor, 0.1),
                          color: info.cor,
                          borderLeft: `3px solid ${info.cor}`,
                          borderRight: `1px solid ${hexParaRgba(info.cor, 0.25)}`,
                          borderTop: `1px solid ${hexParaRgba(info.cor, 0.25)}`,
                          borderBottom: `1px solid ${hexParaRgba(info.cor, 0.25)}`,
                        }}
                        title={`${info.nome}: ${evento.titulo}`}
                      >
                        <div className="badge-evento-conteudo">
                          <span className="badge-evento-colab">{nomeExibicao}</span>
                          <span className="badge-evento-titulo">
                            {temColaborador && info.chave !== 'folga'
                              ? `[${info.nome}] ${evento.titulo}`
                              : evento.titulo}
                          </span>
                        </div>

                        {/* Botão de Exclusão Rápida */}
                        <button
                          type="button"
                          className="btn-excluir-evento-rapido"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventoParaExcluir(evento);
                          }}
                          title="Remover este agendamento"
                          aria-label="Remover agendamento"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Agendamento (Ao clicar no dia) */}
      {diaSelecionado && (
        <ErrorBoundary
          key={diaSelecionado instanceof Date ? diaSelecionado.getTime() : 'modal-evento'}
          aoResetar={() => setDiaSelecionado(null)}
        >
          <ModalDeEvento
            data={diaSelecionado}
            aoFechar={() => setDiaSelecionado(null)}
            aoSalvar={adicionarEvento}
          />
        </ErrorBoundary>
      )}

      {/* Modal de Lançar Férias */}
      {modalFeriasAberto && (
        <ErrorBoundary aoResetar={() => setModalFeriasAberto(false)}>
          <ModalDeFerias
            aoFechar={() => setModalFeriasAberto(false)}
            aoSalvar={adicionarVariosEventos}
          />
        </ErrorBoundary>
      )}

      {/* Modal de Seleção Rápida de Mês/Ano */}
      {modalMesesAberto && (
        <div
          className="modal-overlay-calendario"
          onClick={() => setModalMesesAberto(false)}
        >
          <div
            className="modal-card-meses"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-meses-navegacao-ano">
              <button
                type="button"
                className="btn-navegacao-mes"
                onClick={() => setAnoSelecionadoModal((a) => a - 1)}
                title="Ano Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <h3 className="modal-ano-titulo">{anoSelecionadoModal}</h3>
              <button
                type="button"
                className="btn-navegacao-mes"
                onClick={() => setAnoSelecionadoModal((a) => a + 1)}
                title="Próximo Ano"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid-selecao-meses">
              {nomesDosMeses.map((nomeMes, index) => {
                const isMesAtualHoje =
                  dataHoje.getMonth() === index &&
                  dataHoje.getFullYear() === anoSelecionadoModal;
                const isMesSelecionado =
                  mes === index && ano === anoSelecionadoModal;

                return (
                  <button
                    key={index}
                    type="button"
                    className={`btn-opcao-mes ${isMesSelecionado ? 'selecionado' : ''} ${
                      isMesAtualHoje ? 'mes-atual' : ''
                    }`}
                    onClick={() => selecionarMesNoModal(index)}
                  >
                    {nomeMes.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Evento */}
      {eventoParaExcluir && (
        <ModalConfirmacaoExclusao
          titulo="Excluir Agendamento?"
          mensagem="Tem certeza que deseja remover o agendamento"
          nomeItem={
            eventoParaExcluir.colaborador?.nome
              ? `${eventoParaExcluir.titulo} (${eventoParaExcluir.colaborador.nome})`
              : eventoParaExcluir.titulo
          }
          aoConfirmar={lidarComConfirmacaoExclusaoEvento}
          aoCancelar={() => setEventoParaExcluir(null)}
        />
      )}
    </div>
  );
};
