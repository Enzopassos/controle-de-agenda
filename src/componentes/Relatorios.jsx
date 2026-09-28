import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Users,
  Coffee,
  Palmtree,
  Download,
  Printer,
  X,
  Clock,
} from 'lucide-react';
import { useEventos } from '../hooks/useEventos';
import { useColaboradores } from '../hooks/useColaboradores';
import { useTiposRegistro } from '../hooks/useTiposRegistro';
import { CabecalhoPagina } from './CabecalhoPagina';
import './Relatorios.css';

const ehEventoFerias = (evento) => {
  if (!evento) return false;
  return (
    evento.tipo === 'ferias' ||
    (Boolean(evento.titulo) &&
      (evento.titulo.toLowerCase().includes('férias') ||
        evento.titulo.toLowerCase().includes('ferias')))
  );
};

const obterIniciais = (nomeCompleto) => {
  if (!nomeCompleto) return 'FU';
  const partes = nomeCompleto.trim().split(' ').filter(Boolean);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

const formatarDataComDiaSemana = (dataIso) => {
  if (!dataIso) return { dataFormatada: '--', diaSemana: '' };
  const [ano, mes, dia] = dataIso.split('-');
  const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const diaSemana = dataObj
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '');
  return {
    dataFormatada: `${dia}/${mes}/${ano}`,
    diaSemana,
  };
};

export const Relatorios = () => {
  const { eventos, carregando: carregandoEventos } = useEventos();
  const { colaboradores, carregando: carregandoColab } = useColaboradores();
  const { tipos, obterTipoPorChave } = useTiposRegistro();

  const [filtroMes, setFiltroMes] = useState('todos');
  const [filtroColaborador, setFiltroColaborador] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Filtra do banco todas as ausências (folgas, férias e tipos configurados para computar ausência)
  const ausencias = useMemo(() => {
    return eventos.filter((e) => {
      if (ehEventoFerias(e)) return true;
      const info = obterTipoPorChave(e.tipo);
      if (info) return Boolean(info.computa_ausencia);
      return e.tipo === 'folga';
    });
  }, [eventos, obterTipoPorChave]);

  // Aplica os filtros da tela
  const registrosFiltrados = useMemo(() => {
    return ausencias
      .filter((registro) => {
        let passaMes = true;
        let passaColab = true;
        let passaTipo = true;

        if (filtroMes !== 'todos') {
          const mesRegistro = registro.data.substring(0, 7); // YYYY-MM
          passaMes = mesRegistro === filtroMes;
        }

        if (filtroColaborador !== 'todos') {
          passaColab = registro.colaborador_id === filtroColaborador;
        }

        if (filtroTipo !== 'todos') {
          if (filtroTipo === 'ferias') {
            passaTipo = ehEventoFerias(registro);
          } else {
            passaTipo = registro.tipo === filtroTipo;
          }
        }

        return passaMes && passaColab && passaTipo;
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [ausencias, filtroMes, filtroColaborador, filtroTipo]);

  // Meses únicos disponíveis
  const mesesDisponiveis = useMemo(() => {
    const meses = new Set();
    ausencias.forEach((f) => meses.add(f.data.substring(0, 7)));
    return Array.from(meses).sort((a, b) => b.localeCompare(a));
  }, [ausencias]);

  // Formatação de mês para exibição (ex: 2026-10 -> Outubro/2026)
  const formatarMesLabel = (anoMes) => {
    const [ano, mes] = anoMes.split('-');
    const dataRef = new Date(Number(ano), Number(mes) - 1, 1);
    const nomeMes = dataRef.toLocaleDateString('pt-BR', { month: 'long' });
    const nomeMesCap = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
    return `${nomeMesCap} de ${ano}`;
  };

  // Indicadores do Período Filtrado
  const totalAusencias = registrosFiltrados.length;
  const totalFolgas = registrosFiltrados.filter(
    (r) => !ehEventoFerias(r) && (r.tipo === 'folga' || obterTipoPorChave(r.tipo)?.chave === 'folga')
  ).length;
  const totalFerias = registrosFiltrados.filter(ehEventoFerias).length;
  const totalFuncionariosImpactados = new Set(
    registrosFiltrados.map((r) => r.colaborador_id).filter(Boolean)
  ).size;

  // Exportar dados filtrados para CSV com compatibilidade para Excel
  const lidarComExportacaoCsv = () => {
    if (registrosFiltrados.length === 0) return;

    const cabecalhos = [
      'Data',
      'Funcionário',
      'Cargo',
      'Tipo de Registro',
      'Motivo / Observação',
      'Status',
    ];

    const hoje = new Date();
    const dataHojeLocal = new Date(
      hoje.getTime() - hoje.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split('T')[0];

    const linhas = registrosFiltrados.map((reg) => {
      const dataFormatada = reg.data.split('-').reverse().join('/');
      const nomeFuncionario = reg.colaborador?.nome || 'Desconhecido';
      const cargoFuncionario = reg.colaborador?.cargo || '';
      const tipoInfo = obterTipoPorChave(reg.tipo);
      const tipoNome = ehEventoFerias(reg)
        ? 'Férias'
        : tipoInfo?.nome || reg.tipo;
      const observacao = (reg.titulo || '').replace(/"/g, '""');

      let status = 'Agendada';
      if (reg.data < dataHojeLocal) status = 'Concluída';
      if (reg.data === dataHojeLocal) status = 'Ocorrendo';

      return [
        `"${dataFormatada}"`,
        `"${nomeFuncionario}"`,
        `"${cargoFuncionario}"`,
        `"${tipoNome}"`,
        `"${observacao}"`,
        `"${status}"`,
      ].join(';');
    });

    const conteudoCsv =
      '\uFEFF' + [cabecalhos.join(';'), ...linhas].join('\r\n');
    const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dataHojeStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `relatorio_ausencias_${dataHojeStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const limparFiltros = () => {
    setFiltroMes('todos');
    setFiltroColaborador('todos');
    setFiltroTipo('todos');
  };

  const temFiltroAtivo =
    filtroMes !== 'todos' ||
    filtroColaborador !== 'todos' ||
    filtroTipo !== 'todos';

  const hoje = new Date();
  const dataHojeLocal = new Date(
    hoje.getTime() - hoje.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split('T')[0];

  return (
    <div className="relatorios-pagina">
      {/* 1. Cabeçalho Padronizado da Página */}
      <CabecalhoPagina
        icone={FileText}
        titulo="Relatórios de Ausências"
        subtitulo="Histórico e métricas de afastamentos, folgas e férias dos funcionários."
      />

      {/* 2. Grade de Indicadores Executivos do Período */}
      <section className="relatorios-kpis-grade" aria-label="Indicadores do Período">
        <article className="kpi-relatorio-card">
          <div className="kpi-relatorio-topo">
            <span className="kpi-relatorio-rotulo">Total de Ausências</span>
            <div className="kpi-relatorio-icone-box azul">
              <Calendar size={18} />
            </div>
          </div>
          <div className="kpi-relatorio-dados">
            <span className="kpi-relatorio-numero">{totalAusencias}</span>
            <span className="kpi-relatorio-unidade">registros</span>
          </div>
        </article>

        <article className="kpi-relatorio-card">
          <div className="kpi-relatorio-topo">
            <span className="kpi-relatorio-rotulo">Folgas Concedidas</span>
            <div className="kpi-relatorio-icone-box amarelo">
              <Coffee size={18} />
            </div>
          </div>
          <div className="kpi-relatorio-dados">
            <span className="kpi-relatorio-numero">{totalFolgas}</span>
            <span className="kpi-relatorio-unidade">dias</span>
          </div>
        </article>

        <article className="kpi-relatorio-card">
          <div className="kpi-relatorio-topo">
            <span className="kpi-relatorio-rotulo">Períodos de Férias</span>
            <div className="kpi-relatorio-icone-box laranja">
              <Palmtree size={18} />
            </div>
          </div>
          <div className="kpi-relatorio-dados">
            <span className="kpi-relatorio-numero">{totalFerias}</span>
            <span className="kpi-relatorio-unidade">registros</span>
          </div>
        </article>

        <article className="kpi-relatorio-card">
          <div className="kpi-relatorio-topo">
            <span className="kpi-relatorio-rotulo">Funcionários</span>
            <div className="kpi-relatorio-icone-box verde">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-relatorio-dados">
            <span className="kpi-relatorio-numero">{totalFuncionariosImpactados}</span>
            <span className="kpi-relatorio-unidade">com ausência</span>
          </div>
        </article>
      </section>

      {/* 3. Barra de Ferramentas / Filtros e Ações */}
      <section className="relatorios-barra-filtros" aria-label="Filtros e Ações do Relatório">
        <div className="filtros-campos-grupo">
          {/* Mês de Referência */}
          <div className="filtro-item-bloco">
            <label className="filtro-item-rotulo" htmlFor="filtro-mes-select">
              Mês de Referência
            </label>
            <select
              id="filtro-mes-select"
              className="filtro-item-select"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
            >
              <option value="todos">Todo o histórico</option>
              {mesesDisponiveis.map((mes) => (
                <option key={mes} value={mes}>
                  {formatarMesLabel(mes)}
                </option>
              ))}
            </select>
          </div>

          {/* Funcionário */}
          <div className="filtro-item-bloco">
            <label className="filtro-item-rotulo" htmlFor="filtro-colab-select">
              Funcionário
            </label>
            <select
              id="filtro-colab-select"
              className="filtro-item-select"
              value={filtroColaborador}
              onChange={(e) => setFiltroColaborador(e.target.value)}
            >
              <option value="todos">Todos os funcionários</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Ausência */}
          <div className="filtro-item-bloco">
            <label className="filtro-item-rotulo" htmlFor="filtro-tipo-select">
              Tipo de Registro
            </label>
            <select
              id="filtro-tipo-select"
              className="filtro-item-select"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="todos">Todos os tipos de ausência</option>
              <option value="folga">Folga</option>
              <option value="ferias">Férias</option>
              {tipos
                .filter(
                  (t) =>
                    Boolean(t.computa_ausencia) &&
                    t.chave !== 'folga' &&
                    t.chave !== 'ferias'
                )
                .map((t) => (
                  <option key={t.chave} value={t.chave}>
                    {t.nome}
                  </option>
                ))}
            </select>
          </div>

          {temFiltroAtivo && (
            <button
              type="button"
              className="btn-relatorio-acao"
              onClick={limparFiltros}
              title="Limpar todos os filtros"
              style={{ alignSelf: 'flex-end', height: '37px' }}
            >
              <X size={15} />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {/* Ações: Exportar CSV e Imprimir */}
        <div className="relatorios-acoes-grupo">
          <button
            type="button"
            className="btn-relatorio-acao"
            onClick={() => window.print()}
            title="Imprimir relatório"
          >
            <Printer size={15} />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            className="btn-relatorio-acao primario"
            onClick={lidarComExportacaoCsv}
            disabled={registrosFiltrados.length === 0}
            title="Exportar dados filtrados para planilha CSV"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </section>

      {/* 4. Tabela Gerencial Executiva */}
      <main className="relatorios-tabela-container" aria-label="Tabela de Ausências">
        {carregandoEventos || carregandoColab ? (
          <div className="relatorios-carregando">
            <Clock size={28} className="icone-girando" style={{ color: '#2563eb' }} />
            <p>Carregando histórico de ausências dos funcionários...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="relatorios-estado-vazio">
            <div className="relatorios-icone-vazio">
              <FileText size={30} />
            </div>
            <h3 className="relatorios-titulo-vazio">
              Nenhuma ausência encontrada para os filtros selecionados
            </h3>
            <p className="relatorios-subtitulo-vazio">
              Tente alterar o mês de referência, funcionário ou categoria para visualizar os registros.
            </p>
            {temFiltroAtivo && (
              <button
                type="button"
                className="btn-limpar-filtros-relatorio"
                onClick={limparFiltros}
              >
                Limpar filtros aplicados
              </button>
            )}
          </div>
        ) : (
          <div className="tabela-relatorios-scroll">
            <table className="tabela-relatorios">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Funcionário</th>
                  <th>Tipo de Registro</th>
                  <th>Motivo / Observação</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((registro) => {
                  const { dataFormatada, diaSemana } = formatarDataComDiaSemana(registro.data);
                  const isFerias = ehEventoFerias(registro);
                  const tipoInfo = obterTipoPorChave(registro.tipo);
                  const rotuloTipo = isFerias
                    ? 'Férias'
                    : tipoInfo?.nome || registro.tipo;
                  const corTipo =
                    tipoInfo?.cor_hex || (isFerias ? '#f97316' : '#ef4444');

                  let status = 'Agendada';
                  let classeStatus = 'agendada';
                  if (registro.data < dataHojeLocal) {
                    status = 'Concluída';
                    classeStatus = 'concluida';
                  } else if (registro.data === dataHojeLocal) {
                    status = 'Ocorrendo Hoje';
                    classeStatus = 'ocorrendo';
                  }

                  const nomeFuncionario =
                    registro.colaborador?.nome || 'Desconhecido';
                  const cargoFuncionario = registro.colaborador?.cargo;

                  return (
                    <tr key={registro.id}>
                      {/* Data */}
                      <td>
                        <div className="celula-data-bloco">
                          <span className="celula-data-principal">
                            {dataFormatada}
                          </span>
                          <span className="celula-data-semana">
                            {diaSemana}
                          </span>
                        </div>
                      </td>

                      {/* Funcionário */}
                      <td>
                        <div className="celula-funcionario-bloco">
                          <div
                            className="celula-funcionario-avatar"
                            aria-hidden="true"
                          >
                            {obterIniciais(nomeFuncionario)}
                          </div>
                          <div className="celula-funcionario-textos">
                            <span className="celula-funcionario-nome">
                              {nomeFuncionario}
                            </span>
                            {cargoFuncionario && (
                              <span className="celula-funcionario-cargo">
                                {cargoFuncionario}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tipo com Cor Oficial */}
                      <td>
                        <span className="badge-tipo-categoria">
                          <span
                            className="ponto-cor-badge"
                            style={{ backgroundColor: corTipo }}
                            aria-hidden="true"
                          />
                          <span>{rotuloTipo}</span>
                        </span>
                      </td>

                      {/* Motivo / Observação */}
                      <td>
                        <span className="celula-observacao-texto">
                          {registro.titulo || '—'}
                        </span>
                      </td>

                      {/* Status Temporal */}
                      <td>
                        <span
                          className={`badge-status-temporal ${classeStatus}`}
                        >
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
      </main>
    </div>
  );
};
