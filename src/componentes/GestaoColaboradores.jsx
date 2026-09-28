import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Briefcase
} from 'lucide-react';
import { useColaboradores } from '../hooks/useColaboradores';
import { CabecalhoPagina } from './CabecalhoPagina';
import { ModalColaborador } from './ModalColaborador';
import { ModalConfirmacaoExclusao } from './ModalConfirmacaoExclusao';
import './GestaoColaboradores.css';

/**
 * Utilitário para extrair as iniciais do colaborador para o avatar.
 */
const extrairIniciais = (nome) => {
  if (!nome) return 'CO';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

export const GestaoColaboradores = () => {
  const { colaboradores, carregando, adicionar, atualizar, remover } = useColaboradores();

  // Estados de Controle do Modal de Cadastro / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [colaboradorParaEditar, setColaboradorParaEditar] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Estados de Busca e Feedback
  const [termoBusca, setTermoBusca] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Modal de Exclusão
  const [colaboradorParaExcluir, setColaboradorParaExcluir] = useState(null);

  // Filtro de colaboradores em tempo real
  const colaboradoresFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return colaboradores;
    const buscaMinuscula = termoBusca.trim().toLowerCase();
    return colaboradores.filter((colab) => {
      const nomeMatch = colab.nome?.toLowerCase().includes(buscaMinuscula);
      const cargoMatch = colab.cargo?.toLowerCase().includes(buscaMinuscula);
      return nomeMatch || cargoMatch;
    });
  }, [colaboradores, termoBusca]);

  const abrirModalCriacao = () => {
    setColaboradorParaEditar(null);
    setModalAberto(true);
  };

  const abrirModalEdicao = (colaborador) => {
    setColaboradorParaEditar(colaborador);
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (!salvando) {
      setModalAberto(false);
      setColaboradorParaEditar(null);
    }
  };

  const lidarComSalvarColaborador = async (dados) => {
    setSalvando(true);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      if (colaboradorParaEditar) {
        await atualizar(colaboradorParaEditar.id, dados);
        setMensagemSucesso(`Colaborador "${dados.nome}" atualizado com sucesso!`);
      } else {
        await adicionar(dados);
        setMensagemSucesso(`Colaborador "${dados.nome}" cadastrado com sucesso!`);
      }

      fecharModal();
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (erro) {
      setMensagemErro(erro.message || 'Falha ao salvar o colaborador.');
    } finally {
      setSalvando(false);
    }
  };

  const lidarComConfirmacaoExclusao = async () => {
    if (!colaboradorParaExcluir) return;

    try {
      await remover(colaboradorParaExcluir.id);
      setMensagemSucesso(`Colaborador "${colaboradorParaExcluir.nome}" removido com sucesso.`);
      setColaboradorParaExcluir(null);
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (erro) {
      setMensagemErro(erro.message || 'Erro ao remover colaborador.');
      setColaboradorParaExcluir(null);
    }
  };

  return (
    <div className="gestao-colaboradores-pagina">
      {/* 1. Cabeçalho Padronizado da Página */}
      <CabecalhoPagina
        icone={Users}
        titulo="Gestão de Colaboradores"
        subtitulo="Gerencie a equipe de funcionários da autoescola."
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

      {/* 3. Seção da Barra de Ferramentas: Busca à Esquerda & Botão Adicionar à Direita */}
      <section className="barra-ferramentas-colaboradores" aria-label="Ações e Pesquisa">
        <div className="ferramenta-busca-lado-esquerdo">
          <div className="campo-pesquisa-container">
            <Search size={16} className="icone-lupa-pesquisa" aria-hidden="true" />
            <input
              type="text"
              className="input-pesquisa-colaboradores"
              placeholder="Buscar colaborador por nome ou cargo..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              aria-label="Buscar colaborador"
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
          className="btn-adicionar-colaborador-solido"
          onClick={abrirModalCriacao}
          title="Cadastrar novo colaborador"
        >
          <UserPlus size={17} />
          <span>Adicionar Colaborador</span>
        </button>
      </section>

      {/* 4. Grade de Cards de Colaboradores */}
      <main className="secao-grade-colaboradores" aria-label="Lista de Colaboradores">
        {carregando ? (
          <div className="estado-carregando-card">
            <p>Carregando equipe da autoescola...</p>
          </div>
        ) : colaboradoresFiltrados.length === 0 ? (
          <div className="estado-vazio-colaboradores">
            <div className="circulo-icone-vazio">
              <Users size={32} />
            </div>
            <h3 className="titulo-vazio">
              {termoBusca
                ? `Nenhum colaborador encontrado para "${termoBusca}".`
                : 'Nenhum colaborador cadastrado na equipe ainda.'}
            </h3>
            <p className="subtitulo-vazio">
              {termoBusca
                ? 'Verifique a ortografia digitada ou limpe a busca.'
                : 'Cadastre os funcionários para gerenciar seus agendamentos.'}
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
                className="btn-adicionar-primeiro-colaborador"
                onClick={abrirModalCriacao}
              >
                <UserPlus size={16} />
                <span>Adicionar Primeiro Colaborador</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid-cards-colaboradores">
            {colaboradoresFiltrados.map((colaborador) => (
              <article key={colaborador.id} className="card-colaborador-grid">
                <div className="card-colaborador-corpo">
                  <div className="card-colaborador-avatar" aria-hidden="true">
                    {extrairIniciais(colaborador.nome)}
                  </div>
                  <div className="card-colaborador-dados">
                    <h3 className="card-colaborador-nome" title={colaborador.nome}>
                      {colaborador.nome}
                    </h3>
                    <div className="card-colaborador-cargo-chip">
                      <Briefcase size={13} />
                      <span>{colaborador.cargo || 'Função não especificada'}</span>
                    </div>
                  </div>
                </div>

                <div className="card-colaborador-rodape">
                  <button
                    type="button"
                    className="btn-card-acao editar"
                    onClick={() => abrirModalEdicao(colaborador)}
                    title={`Editar ${colaborador.nome}`}
                    aria-label={`Editar ${colaborador.nome}`}
                  >
                    <Pencil size={14} />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    className="btn-card-acao excluir"
                    onClick={() => setColaboradorParaExcluir(colaborador)}
                    title={`Excluir ${colaborador.nome}`}
                    aria-label={`Excluir ${colaborador.nome}`}
                  >
                    <Trash2 size={14} />
                    <span>Excluir</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* 5. Modal de Cadastro e Edição */}
      {modalAberto && (
        <ModalColaborador
          key={colaboradorParaEditar?.id || 'novo'}
          aberto={modalAberto}
          colaboradorParaEditar={colaboradorParaEditar}
          aoSalvar={lidarComSalvarColaborador}
          aoFechar={fecharModal}
          salvando={salvando}
        />
      )}

      {/* 6. Modal de Confirmação de Exclusão */}
      {colaboradorParaExcluir && (
        <ModalConfirmacaoExclusao
          titulo="Excluir Colaborador?"
          mensagem="Tem certeza que deseja remover o colaborador"
          nomeItem={colaboradorParaExcluir.nome}
          aoConfirmar={lidarComConfirmacaoExclusao}
          aoCancelar={() => setColaboradorParaExcluir(null)}
        />
      )}
    </div>
  );
};
