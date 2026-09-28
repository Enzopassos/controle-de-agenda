import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Users,
  CalendarCheck
} from 'lucide-react';
import { useTiposRegistro } from '../hooks/useTiposRegistro';
import { CabecalhoPagina } from './CabecalhoPagina';
import { ModalTipoRegistro } from './ModalTipoRegistro';
import { ModalConfirmacaoExclusao } from './ModalConfirmacaoExclusao';
import { gerarChaveSlug } from '../utils/corUtils';
import './GestaoTiposRegistro.css';

export const GestaoTiposRegistro = () => {
  const {
    tipos,
    carregando,
    adicionarTipo,
    atualizarTipo,
    removerTipo,
  } = useTiposRegistro();

  // Estados do Modal de Cadastro / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoParaEditar, setTipoParaEditar] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Estados de Busca e Feedback
  const [termoBusca, setTermoBusca] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Modal de Exclusão
  const [tipoParaExcluir, setTipoParaExcluir] = useState(null);

  // Filtro de categorias em tempo real
  const tiposFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return tipos;
    const buscaMinuscula = termoBusca.trim().toLowerCase();
    return tipos.filter((t) => {
      const nomeMatch = t.nome?.toLowerCase().includes(buscaMinuscula);
      const chaveMatch = t.chave?.toLowerCase().includes(buscaMinuscula);
      return nomeMatch || chaveMatch;
    });
  }, [tipos, termoBusca]);

  const abrirModalCriacao = () => {
    setTipoParaEditar(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (tipo) => {
    setTipoParaEditar(tipo);
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (!salvando) {
      setModalAberto(false);
      setTipoParaEditar(null);
    }
  };

  const lidarComSalvarTipo = async (dados) => {
    setSalvando(true);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      if (tipoParaEditar) {
        await atualizarTipo(tipoParaEditar.id, {
          nome: dados.nome,
          cor_hex: dados.cor_hex,
          exige_colaborador: dados.exige_colaborador,
          computa_ausencia: dados.computa_ausencia,
        });
        setMensagemSucesso(`Categoria "${dados.nome}" atualizada com sucesso!`);
      } else {
        await adicionarTipo({
          nome: dados.nome,
          chave: gerarChaveSlug(dados.nome),
          cor_hex: dados.cor_hex,
          exige_colaborador: dados.exige_colaborador,
          computa_ausencia: dados.computa_ausencia,
        });
        setMensagemSucesso(`Categoria "${dados.nome}" cadastrada com sucesso!`);
      }

      fecharModal();
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (erro) {
      setMensagemErro(erro.message || 'Falha ao salvar o tipo de registro.');
    } finally {
      setSalvando(false);
    }
  };

  const lidarComConfirmacaoExclusao = async () => {
    if (!tipoParaExcluir) return;

    try {
      await removerTipo(tipoParaExcluir.id);
      setMensagemSucesso(`Categoria "${tipoParaExcluir.nome}" removida com sucesso.`);
      setTipoParaExcluir(null);
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (erro) {
      setMensagemErro(erro.message || 'Erro ao remover tipo de registro.');
      setTipoParaExcluir(null);
    }
  };

  return (
    <div className="gestao-tipos-pagina">
      {/* 1. Cabeçalho Padronizado da Página */}
      <CabecalhoPagina
        icone={Tag}
        titulo="Tipos de Registro"
        subtitulo="Cadastre e personalize categorias, cores e regras de preenchimento da agenda."
      />

      {/* 2. Alertas de Sucesso e Erro */}
      {mensagemSucesso && (
        <div className="alerta-feedback-card sucesso" role="status">
          <CheckCircle2 size={18} className="alerta-icone" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="alerta-feedback-card erro" role="alert">
          <AlertCircle size={18} className="alerta-icone" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* 3. Barra de Ferramentas Superior: Busca à Esquerda & Botão Criar à Direita */}
      <section className="barra-ferramentas-tipos" aria-label="Ações e Pesquisa">
        <div className="ferramenta-busca-lado-esquerdo">
          <div className="campo-pesquisa-container">
            <Search size={16} className="icone-lupa-pesquisa" aria-hidden="true" />
            <input
              type="text"
              className="input-pesquisa-tipos"
              placeholder="Buscar categoria por nome ou código..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              aria-label="Buscar categoria"
            />
            {termoBusca && (
              <button
                type="button"
                className="btn-limpar-pesquisa"
                onClick={() => setTermoBusca('')}
                title="Limpar pesquisa"
                aria-label="Limpar pesquisa"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          className="btn-adicionar-tipo-solido"
          onClick={abrirModalCriacao}
          title="Cadastrar nova categoria de agendamento"
        >
          <Plus size={17} />
          <span>Adicionar Tipo de Registro</span>
        </button>
      </section>

      {/* 4. Grade de Cards de Tipos de Registro */}
      <main className="secao-grade-tipos" aria-label="Lista de Tipos de Registro">
        {carregando ? (
          <div className="estado-carregando-card">
            <p>Carregando categorias e cores do sistema...</p>
          </div>
        ) : tiposFiltrados.length === 0 ? (
          <div className="estado-vazio-tipos">
            <div className="circulo-icone-vazio">
              <Tag size={32} />
            </div>
            <h3 className="titulo-vazio">
              {termoBusca
                ? `Nenhum tipo de registro encontrado para "${termoBusca}".`
                : 'Nenhuma categoria cadastrada no sistema ainda.'}
            </h3>
            <p className="subtitulo-vazio">
              {termoBusca
                ? 'Verifique a ortografia digitada ou limpe o campo de busca.'
                : 'Cadastre categorias com cores personalizadas para organizar o calendário.'}
            </p>
            {termoBusca ? (
              <button
                type="button"
                className="btn-limpar-filtro-vazio"
                onClick={() => setTermoBusca('')}
              >
                Limpar busca
              </button>
            ) : (
              <button
                type="button"
                className="btn-adicionar-primeiro-tipo"
                onClick={abrirModalCriacao}
              >
                <Plus size={16} />
                <span>Adicionar Primeiro Tipo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid-cards-tipos">
            {tiposFiltrados.map((tipo) => {
              const corOficial = tipo.cor_hex || '#3b82f6';

              return (
                <article
                  key={tipo.id || tipo.chave}
                  className="card-tipo-grid"
                  style={{ borderTop: `4px solid ${corOficial}` }}
                >
                  <div className="card-tipo-corpo">
                    {/* Topo do Card: Ponto de Cor e Nome em destaque total */}
                    <div className="card-tipo-cabecalho">
                      <div
                        className="card-tipo-ponto-cor"
                        style={{ backgroundColor: corOficial }}
                        aria-hidden="true"
                      />
                      <h3 className="card-tipo-nome" title={tipo.nome}>
                        {tipo.nome}
                      </h3>
                    </div>

                    {/* Tags das Regras Operacionais em linha */}
                    <div className="card-tipo-regras-bloco">
                      <div
                        className={`chip-regra-status ${tipo.exige_colaborador ? 'ativo' : 'inativo'}`}
                        title={tipo.exige_colaborador ? 'Exige selecionar um funcionário' : 'Não exige funcionário'}
                      >
                        <Users size={13} />
                        <span>
                          {tipo.exige_colaborador ? 'Exige Funcionário' : 'Sem vínculo'}
                        </span>
                      </div>

                      <div
                        className={`chip-regra-status ${tipo.computa_ausencia ? 'ausencia' : 'regular'}`}
                        title={tipo.computa_ausencia ? 'Computa ausência da equipe' : 'Atividade regular na agenda'}
                      >
                        <CalendarCheck size={13} />
                        <span>
                          {tipo.computa_ausencia ? 'Computa Ausência' : 'Atividade Regular'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card: Ações de Editar e Excluir */}
                  <div className="card-tipo-rodape">
                    <button
                      type="button"
                      className="btn-card-acao editar"
                      onClick={() => abrirModalEdicao(tipo)}
                      title={`Editar categoria ${tipo.nome}`}
                      aria-label={`Editar ${tipo.nome}`}
                    >
                      <Pencil size={14} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      className="btn-card-acao excluir"
                      onClick={() => setTipoParaExcluir(tipo)}
                      title={`Excluir categoria ${tipo.nome}`}
                      aria-label={`Excluir ${tipo.nome}`}
                    >
                      <Trash2 size={14} />
                      <span>Excluir</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Modal de Cadastro e Edição de Tipos de Registro */}
      {modalAberto && (
        <ModalTipoRegistro
          key={tipoParaEditar?.id || 'novo'}
          aberto={modalAberto}
          tipoParaEditar={tipoParaEditar}
          aoSalvar={lidarComSalvarTipo}
          aoFechar={fecharModal}
          salvando={salvando}
        />
      )}

      {/* 6. Modal de Confirmação de Exclusão Segura */}
      {tipoParaExcluir && (
        <ModalConfirmacaoExclusao
          titulo="Excluir Tipo de Registro?"
          mensagem="Tem certeza que deseja excluir o tipo de registro"
          nomeItem={tipoParaExcluir.nome}
          aoConfirmar={lidarComConfirmacaoExclusao}
          aoCancelar={() => setTipoParaExcluir(null)}
        />
      )}
    </div>
  );
};
