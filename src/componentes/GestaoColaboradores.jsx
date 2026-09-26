import React, { useState } from 'react';
import { UserPlus, Trash2, Check, AlertCircle } from 'lucide-react';
import { useColaboradores } from '../hooks/useColaboradores';
import { CabecalhoPagina } from './CabecalhoPagina';
import { ModalConfirmacaoExclusao } from './ModalConfirmacaoExclusao';
import './GestaoColaboradores.css';

export const GestaoColaboradores = () => {
  const { colaboradores, carregando, adicionar, remover } = useColaboradores();
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Estado do colaborador selecionado para confirmação de exclusão
  const [colaboradorParaExcluir, setColaboradorParaExcluir] = useState(null);

  const lidarComEnvio = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setSalvando(true);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      await adicionar({ nome: nome.trim(), cargo: cargo.trim() });
      setNome('');
      setCargo('');
      setMensagemSucesso('Colaborador cadastrado com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (erro) {
      setMensagemErro(erro.message || 'Erro ao cadastrar colaborador.');
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
    <div className="calendario-container gestao-colaboradores-container">
      <CabecalhoPagina
        titulo="Gestão de Colaboradores"
        subtitulo="Adicione, remova e gerencie os membros da equipe."
        trilha={[
          { rotulo: 'Gestão' },
          { rotulo: 'Colaboradores' }
        ]}
      />

      {mensagemSucesso && (
        <div style={{
          background: '#dcfce7',
          color: '#166534',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
          marginBottom: '1.5rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={18} />
          {mensagemSucesso}
        </div>
      )}

      {mensagemErro && (
        <div style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid #fecaca',
          marginBottom: '1.5rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} />
          {mensagemErro}
        </div>
      )}

      <div className="painel-adicionar-colaborador">
        <h4 className="painel-adicionar-titulo">
          <UserPlus size={18} />
          <span>Adicionar Colaborador</span>
        </h4>
        <form onSubmit={lidarComEnvio} className="form-adicionar-colaborador">
          <div className="form-grupo" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label>Nome Completo</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: João da Silva"
              required
            />
          </div>
          <div className="form-grupo" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label>Cargo / Função</label>
            <input
              type="text"
              value={cargo}
              onChange={e => setCargo(e.target.value)}
              placeholder="Ex: Instrutor Prático"
            />
          </div>
          <button
            type="submit"
            className="btn btn-salvar"
            style={{ height: '48px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            disabled={salvando}
          >
            <span>{salvando ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </form>
      </div>

      <div>
        <h4 className="secao-equipe-titulo">
          Equipe Atual ({colaboradores.length})
        </h4>
        {carregando ? (
          <p style={{ color: 'var(--text-secondary)' }}>Carregando dados...</p>
        ) : colaboradores.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum colaborador cadastrado no sistema ainda.</p>
        ) : (
          <div className="lista-colaboradores-scroll">
            {colaboradores.map(c => (
              <div key={c.id} className="card-colaborador-item">
                <div>
                  <div className="colaborador-nome">
                    {c.nome}
                  </div>
                  <div className="colaborador-cargo">
                    {c.cargo || 'Sem cargo definido'}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-acao-tipo excluir"
                  onClick={() => setColaboradorParaExcluir(c)}
                  title={`Excluir ${c.nome}`}
                >
                  <Trash2 size={15} />
                  <span>Excluir</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {colaboradorParaExcluir && (
        <ModalConfirmacaoExclusao
          titulo="Excluir Colaborador?"
          mensagem="Tem certeza que deseja excluir o colaborador"
          nomeItem={colaboradorParaExcluir.nome}
          aoConfirmar={lidarComConfirmacaoExclusao}
          aoCancelar={() => setColaboradorParaExcluir(null)}
        />
      )}
    </div>
  );
};
