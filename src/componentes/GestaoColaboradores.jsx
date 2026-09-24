import { useState } from 'react';
import { useColaboradores } from '../hooks/useColaboradores';
import { CabecalhoPagina } from './CabecalhoPagina';

export const GestaoColaboradores = () => {
  const { colaboradores, carregando, adicionar, remover } = useColaboradores();
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');

  const lidarComEnvio = (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    adicionar({ nome, cargo });
    setNome('');
    setCargo('');
  };

  return (
    <div className="calendario-container" style={{ padding: '2.5rem' }}>
      <CabecalhoPagina
        titulo="Gestão de Colaboradores"
        subtitulo="Adicione, remova e gerencie os membros da equipe."
        trilha={[
          { rotulo: 'Gestão' },
          { rotulo: 'Colaboradores' }
        ]}
      />

      <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Adicionar Colaborador</h4>
        <form onSubmit={lidarComEnvio} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-grupo" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label>Nome Completo</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva" required />
          </div>
          <div className="form-grupo" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label>Cargo / Função</label>
            <input type="text" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex: Desenvolvedor" />
          </div>
          <button type="submit" className="btn btn-salvar" style={{ height: '52px' }}>Salvar</button>
        </form>
      </div>

      <div>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Equipe Atual ({colaboradores.length})</h4>
        {carregando ? (
          <p style={{ color: 'var(--text-secondary)' }}>Carregando dados...</p>
        ) : colaboradores.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum colaborador cadastrado no sistema ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {colaboradores.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.05rem' }}>{c.nome}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{c.cargo || 'Sem cargo definido'}</div>
                </div>
                <button 
                  className="btn-remover-evento" 
                  style={{ position: 'relative', opacity: 1, background: '#fee2e2', color: '#ef4444', padding: '0.5rem 1rem', width: 'auto', height: 'auto', borderRadius: '8px', fontWeight: '600' }} 
                  onClick={() => remover(c.id)}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
