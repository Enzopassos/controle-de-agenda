import { useState } from 'react';
import { obterDiasDoMes, formatarData, nomesDosMeses, diasDaSemana } from '../utils/dataUtils';
import { useEventos } from '../hooks/useEventos';
import { ModalDeEvento } from './ModalDeEvento';
import { CabecalhoPagina } from './CabecalhoPagina';

export const Calendario = () => {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  
  // Estados para o Modal de Meses
  const [modalMesesAberto, setModalMesesAberto] = useState(false);
  const [anoSelecionadoModal, setAnoSelecionadoModal] = useState(new Date().getFullYear());

  const { eventos, adicionarEvento, removerEvento } = useEventos();

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
          // Verifica se o dia atual da iteração é um domingo (getDay() retorna 0 para domingo)
          const isDomingo = dia && dia.getDay() === 0;
          
          return (
            <div 
              key={index} 
              className={`dia-celula ${!dia ? 'vazio' : ''} ${isDomingo ? 'domingo' : ''}`}
              onClick={() => lidarComCliqueNoDia(dia)}
            >
              {dia && <span className="dia-numero">{dia.getDate()}</span>}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {eventosDesteDia.map(evento => (
                  <div 
                    key={evento.id} 
                    className={`evento-badge ${evento.tipo}`}
                    title={evento.titulo}
                  >
                    {evento.tipo === 'folga' ? (
                      <>
                        <span style={{ fontWeight: '700' }}>{evento.colaborador?.nome || 'Desconhecido'}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>{evento.titulo}</span>
                      </>
                    ) : (
                      <span style={{ fontWeight: '600' }}>{evento.titulo}</span>
                    )}
                    
                    <button 
                      className="btn-remover-evento" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removerEvento(evento.id);
                      }}
                      title="Remover"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Agendamento (Ao clicar no dia) */}
      {diaSelecionado && (
        <ModalDeEvento 
          data={diaSelecionado} 
          aoFechar={() => setDiaSelecionado(null)}
          aoSalvar={adicionarEvento}
        />
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
    </div>
  );
};
