import { useState } from 'react';
import { Palmtree } from 'lucide-react';
import { obterDiasDoMes, formatarData, nomesDosMeses, diasDaSemana } from '../utils/dataUtils';
import { useEventos } from '../hooks/useEventos';
import { useTiposRegistro } from '../hooks/useTiposRegistro';
import { obterEstiloBadge } from '../utils/corUtils';
import { ModalDeEvento } from './ModalDeEvento';
import { ModalDeFerias } from './ModalDeFerias';
import { ModalConfirmacaoExclusao } from './ModalConfirmacaoExclusao';
import { CabecalhoPagina } from './CabecalhoPagina';
import { ErrorBoundary } from './ErrorBoundary';

const ehEventoFerias = (evento) => {
  if (!evento) return false;
  return (
    evento.tipo === 'ferias' ||
    (Boolean(evento.titulo) &&
      (evento.titulo.toLowerCase().includes('férias') || evento.titulo.toLowerCase().includes('ferias')))
  );
};

export const Calendario = () => {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  
  // Estados para os Modais
  const [modalMesesAberto, setModalMesesAberto] = useState(false);
  const [modalFeriasAberto, setModalFeriasAberto] = useState(false);
  const [anoSelecionadoModal, setAnoSelecionadoModal] = useState(new Date().getFullYear());
  const [eventoParaExcluir, setEventoParaExcluir] = useState(null);

  const { eventos, adicionarEvento, adicionarVariosEventos, removerEvento } = useEventos();
  const { obterTipoPorChave } = useTiposRegistro();

  const dataHoje = new Date();
  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const dias = obterDiasDoMes(ano, mes);

  const irParaMesAnterior = () => setDataAtual(new Date(ano, mes - 1, 1));
  const irParaProximoMes = () => setDataAtual(new Date(ano, mes + 1, 1));
  const voltarParaHoje = () => setDataAtual(new Date(dataHoje.getFullYear(), dataHoje.getMonth(), 1));

  // Verifica se estamos em um mês ou ano diferente do atual para mostrar o botão
  const mostrarBotaoHoje = ano !== dataHoje.getFullYear() || mes !== dataHoje.getMonth();

  const lidarComCliqueNoDia = (dia) => {
    if (dia) setDiaSelecionado(dia);
  };

  const obterEventosDoDia = (dia) => {
    const dataStr = formatarData(dia);
    return eventos.filter(evento => evento.data === dataStr);
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
    <div className="calendario-container">
      <CabecalhoPagina
        titulo={
          <span 
            className="titulo-mes-clicavel"
            onClick={() => {
              setAnoSelecionadoModal(ano);
              setModalMesesAberto(true);
            }}
            title="Mudar mês/ano rapidamente"
          >
            {nomesDosMeses[mes]} {ano}
          </span>
        }
        subtitulo="Gerencie e acompanhe o calendário corporativo da equipe."
        trilha={[{ rotulo: 'Calendário' }]}
        acoes={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-lancar-ferias"
              onClick={() => setModalFeriasAberto(true)}
              title="Lançar período de férias de um colaborador"
            >
              <Palmtree size={16} />
              <span>Lançar Férias</span>
            </button>
            {mostrarBotaoHoje && (
              <button className="btn-hoje" onClick={voltarParaHoje}>
                Mês Atual
              </button>
            )}
            <button className="btn-navegacao" onClick={irParaMesAnterior} title="Mês Anterior">&lt;</button>
            <button className="btn-navegacao" onClick={irParaProximoMes} title="Próximo Mês">&gt;</button>
          </div>
        }
      />

      <div className="calendario-grade">
        {diasDaSemana.map(diaSemana => (
          <div key={diaSemana} className="dia-semana-item">{diaSemana}</div>
        ))}

        {dias.map((dia, index) => {
          const eventosDesteDia = dia ? obterEventosDoDia(dia) : [];
          const feriasDesteDia = eventosDesteDia.filter(e => ehEventoFerias(e));
          const ausenciasDesteDia = eventosDesteDia.filter(e => {
            if (ehEventoFerias(e)) return false; // Já contado nas férias
            const infoTipo = obterTipoPorChave(e.tipo);
            if (infoTipo) return Boolean(infoTipo.computa_ausencia);
            return e.tipo === 'folga';
          });
          const totalAusenciasDesteDia = ausenciasDesteDia.length + feriasDesteDia.length;
          // Verifica se o dia atual da iteração é um domingo (getDay() retorna 0 para domingo)
          const isDomingo = dia && dia.getDay() === 0;
          
          return (
            <div 
              key={index} 
              className={`dia-celula ${!dia ? 'vazio' : ''} ${isDomingo ? 'domingo' : ''}`}
              onClick={() => lidarComCliqueNoDia(dia)}
            >
              <div className="dia-celula-cabecalho">
                {totalAusenciasDesteDia > 1 && (
                  <span 
                    className="badge-multi-folgas" 
                    title={`${totalAusenciasDesteDia} colaboradores ausentes (folga/férias/afastamento) neste dia`}
                  >
                    {totalAusenciasDesteDia} ausências
                  </span>
                )}
                {dia && <span className="dia-numero">{dia.getDate()}</span>}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {eventosDesteDia.map(evento => {
                  const isFerias = ehEventoFerias(evento);
                  const tipoInfo = obterTipoPorChave(evento.tipo);
                  const temColaborador = Boolean(evento.colaborador?.nome);
                  const estiloBadge = tipoInfo?.cor_hex ? obterEstiloBadge(tipoInfo.cor_hex) : undefined;
                  const classeTipo = isFerias ? 'ferias' : (tipoInfo?.chave || evento.tipo);

                  return (
                    <div 
                      key={evento.id} 
                      className={`evento-badge ${classeTipo}`}
                      style={estiloBadge}
                      title={`${tipoInfo?.nome || evento.tipo}: ${evento.titulo}`}
                    >
                      {isFerias ? (
                        <>
                          <span style={{ fontWeight: '700' }}>
                            {evento.colaborador?.nome || 'Colaborador'} (Férias)
                          </span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>{evento.titulo}</span>
                        </>
                      ) : temColaborador ? (
                        <>
                          <span style={{ fontWeight: '700' }}>{evento.colaborador?.nome}</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                            {tipoInfo && tipoInfo.chave !== 'folga' ? `[${tipoInfo.nome}] ` : ''}{evento.titulo}
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: '700' }}>{evento.titulo}</span>
                          {tipoInfo && tipoInfo.chave !== 'evento' && (
                            <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>{tipoInfo.nome}</span>
                          )}
                        </>
                      )}
                      
                      <button 
                        className="btn-remover-evento" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEventoParaExcluir(evento);
                        }}
                        title="Remover agendamento"
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

      {/* Modal de Agendamento (Ao clicar no dia) */}
      {diaSelecionado && (
        <ErrorBoundary key={diaSelecionado instanceof Date ? diaSelecionado.getTime() : 'modal-evento'} aoResetar={() => setDiaSelecionado(null)}>
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

      {/* Modal de Seleção Rápida de Mês/Ano (Ao clicar no título) */}
      {modalMesesAberto && (
        <div className="modal-overlay" onClick={() => setModalMesesAberto(false)}>
          <div className="modal-conteudo modal-meses" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button className="btn-navegacao" onClick={() => setAnoSelecionadoModal(a => a - 1)}>&lt;</button>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{anoSelecionadoModal}</h3>
              <button className="btn-navegacao" onClick={() => setAnoSelecionadoModal(a => a + 1)}>&gt;</button>
            </div>
            
            <div className="grid-meses">
              {nomesDosMeses.map((nomeMes, index) => {
                // Destaca o mês atual em que estamos hoje, se o ano do modal for o ano atual
                const isMesAtualDoAno = dataHoje.getMonth() === index && dataHoje.getFullYear() === anoSelecionadoModal;
                return (
                  <button 
                    key={index}
                    className={`btn-mes ${isMesAtualDoAno ? 'atual' : ''}`}
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
