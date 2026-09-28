import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  Building
} from 'lucide-react';
import { CabecalhoPagina } from './CabecalhoPagina';
import { ModalConfirmacaoExclusao } from './ModalConfirmacaoExclusao';
import { useTiposRegistro } from '../hooks/useTiposRegistro';
import {
  PALETA_CORES_SUGERIDAS,
  hexParaRgba,
  gerarChaveSlug
} from '../utils/corUtils';
import './GestaoTiposRegistro.css';

export const GestaoTiposRegistro = () => {
  const {
    tipos,
    carregando,
    adicionarTipo,
    atualizarTipo,
    removerTipo
  } = useTiposRegistro();

  // Estados do Formulário
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [nome, setNome] = useState('');
  const [corHex, setCorHex] = useState('#10b981');
  const [exigeColaborador, setExigeColaborador] = useState(false);
  const [computaAusencia, setComputaAusencia] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');

  // Estado do Modal de Confirmação de Exclusão
  const [tipoParaExcluir, setTipoParaExcluir] = useState(null);

  const limparFormulario = () => {
    setIdEmEdicao(null);
    setNome('');
    setCorHex('#10b981');
    setExigeColaborador(false);
    setComputaAusencia(false);
    setMensagemErro('');
  };

  const iniciarEdicao = (tipo) => {
    setIdEmEdicao(tipo.id);
    setNome(tipo.nome);
    setCorHex(tipo.cor_hex || '#3b82f6');
    setExigeColaborador(Boolean(tipo.exige_colaborador));
    setComputaAusencia(Boolean(tipo.computa_ausencia));
    setMensagemErro('');
    setMensagemSucesso('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const lidarComSalvar = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setSalvando(true);
    setMensagemErro('');
    setMensagemSucesso('');

    try {
      if (idEmEdicao) {
        await atualizarTipo(idEmEdicao, {
          nome: nome.trim(),
          cor_hex: corHex,
          exige_colaborador: exigeColaborador,
          computa_ausencia: computaAusencia
        });
        setMensagemSucesso(`Tipo "${nome}" atualizado com sucesso!`);
      } else {
        await adicionarTipo({
          nome: nome.trim(),
          chave: gerarChaveSlug(nome),
          cor_hex: corHex,
          exige_colaborador: exigeColaborador,
          computa_ausencia: computaAusencia
        });
        setMensagemSucesso(`Tipo "${nome}" cadastrado com sucesso!`);
      }
      limparFormulario();
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (erro) {
      setMensagemErro(erro.message || 'Erro ao salvar tipo de registro.');
    } finally {
      setSalvando(false);
    }
  };

  const lidarComConfirmacaoExclusao = async () => {
    if (!tipoParaExcluir) return;

    try {
      await removerTipo(tipoParaExcluir.id);
      if (idEmEdicao === tipoParaExcluir.id) {
        limparFormulario();
      }
      setTipoParaExcluir(null);
      setMensagemSucesso('Tipo de registro removido com sucesso!');
      setTimeout(() => setMensagemSucesso(''), 4000);
    } catch (erro) {
      setMensagemErro(erro.message || 'Erro ao remover tipo de registro.');
      setTipoParaExcluir(null);
    }
  };

  return (
    <div className="gestao-tipos-pagina">
      <CabecalhoPagina
        icone={Tag}
        titulo="Tipos de Registro"
        subtitulo="Cadastre e personalize categorias, cores e regras de preenchimento da agenda."
      />

      <div className="gestao-tipos-card-principal">

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
          fontWeight: '500'
        }}>
          {mensagemErro}
        </div>
      )}

      <div className="gestao-tipos-grid">
        {/* COLUNA ESQUERDA: FORMULÁRIO DE CADASTRO / EDIÇÃO */}
        <div className="painel-formulario-tipo">
          <div className="painel-formulario-titulo">
            {idEmEdicao ? <Pencil size={18} /> : <Plus size={18} />}
            <span>{idEmEdicao ? 'Editar Tipo' : 'Novo Tipo de Registro'}</span>
          </div>
          <p className="painel-formulario-subtitulo">
            {idEmEdicao
              ? 'Altere a cor ou as opções desta categoria.'
              : 'Defina o nome, a cor visual e as regras de associação.'}
          </p>

          <form onSubmit={lidarComSalvar}>
            <div className="form-grupo">
              <label>Nome da Categoria</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Feriado, Atestado Médico..."
                required
              />
            </div>

            <div className="form-grupo">
              <label>Cor de Destaque Visual</label>
              <div className="seletor-cor-container">
                <div className="seletor-cor-input-wrapper">
                  <input
                    type="color"
                    className="input-cor-nativo"
                    value={corHex}
                    onChange={(e) => setCorHex(e.target.value)}
                    title="Selecione uma cor personalizada"
                  />
                  <input
                    type="text"
                    className="input-cor-hex-texto"
                    value={corHex}
                    onChange={(e) => setCorHex(e.target.value)}
                    maxLength={7}
                    style={{ width: '110px' }}
                  />
                </div>

                <div className="paleta-cores-sugeridas">
                  {PALETA_CORES_SUGERIDAS.map((cor) => (
                    <button
                      key={cor.hex}
                      type="button"
                      className={`btn-paleta-cor ${corHex.toLowerCase() === cor.hex.toLowerCase() ? 'selecionada' : ''}`}
                      style={{ backgroundColor: cor.hex }}
                      onClick={() => setCorHex(cor.hex)}
                      title={cor.rotulo}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* OPÇÕES BOOLEANAS AVANÇADAS */}
            <div className="opcoes-checkbox-grupo">
              <label className="checkbox-item-personalizado">
                <input
                  type="checkbox"
                  checked={exigeColaborador}
                  onChange={(e) => setExigeColaborador(e.target.checked)}
                />
                <div className="checkbox-item-textos">
                  <span className="checkbox-titulo">Exige Colaborador</span>
                  <span className="checkbox-descricao">
                    Marque para ausências individuais (ex: folga, atestado). Feriados e eventos gerais devem ficar desmarcados.
                  </span>
                </div>
              </label>

              <label className="checkbox-item-personalizado">
                <input
                  type="checkbox"
                  checked={computaAusencia}
                  onChange={(e) => setComputaAusencia(e.target.checked)}
                />
                <div className="checkbox-item-textos">
                  <span className="checkbox-titulo">Conta como Ausência</span>
                  <span className="checkbox-descricao">
                    Marque se este registro representa ausência de expediente no relatório e nas métricas da equipe.
                  </span>
                </div>
              </label>
            </div>

            {/* PRÉVIA VISUAL EM TEMPO REAL */}
            <div className="caixa-previa-tipo">
              <div className="caixa-previa-label">Prévia no Calendário</div>
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: hexParaRgba(corHex, 0.15),
                  color: corHex,
                  borderLeft: `4px solid ${corHex}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                  {exigeColaborador ? 'João da Silva' : nome || 'Nome do Tipo'}
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                  {exigeColaborador ? (nome || 'Motivo') : 'Evento da Autoescola'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              {idEmEdicao && (
                <button
                  type="button"
                  className="btn btn-cancelar"
                  onClick={limparFormulario}
                  style={{ flex: 1 }}
                >
                  <RotateCcw size={16} style={{ marginRight: '4px' }} />
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="btn btn-salvar"
                style={{ flex: 2 }}
                disabled={salvando || !nome.trim()}
              >
                {salvando ? 'Salvando...' : idEmEdicao ? 'Salvar Alterações' : 'Criar Tipo'}
              </button>
            </div>
          </form>
        </div>

        {/* COLUNA DIREITA: LISTAGEM DOS TIPOS */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={20} color="var(--primary)" />
              <span>Categorias Cadastradas ({tipos.length})</span>
            </h4>
          </div>

          {carregando ? (
            <p style={{ color: 'var(--text-secondary)' }}>Carregando tipos de registro...</p>
          ) : tipos.length === 0 ? (
            <div style={{
              background: 'white',
              padding: '2.5rem',
              borderRadius: '16px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              color: 'var(--text-secondary)'
            }}>
              <Sparkles size={32} style={{ marginBottom: '0.75rem', color: '#94a3b8' }} />
              <p>Nenhum tipo cadastrado ainda. Crie o primeiro formulário ao lado!</p>
            </div>
          ) : (
            <div className="lista-tipos-cards">
              {tipos.map((tipo) => (
                <div key={tipo.id || tipo.chave} className="card-tipo-item">
                  <div className="card-tipo-info">
                    <div
                      className="card-tipo-barra-cor"
                      style={{ backgroundColor: tipo.cor_hex || '#3b82f6' }}
                    />
                    <div className="card-tipo-dados">
                      <div className="card-tipo-nome">
                        <span>{tipo.nome}</span>
                        <span className="card-tipo-chave">#{tipo.chave}</span>
                      </div>

                      <div className="card-tipo-tags">
                        {tipo.exige_colaborador ? (
                          <span className="tag-recurso-tipo colaborador" title="Requer selecionar um colaborador da equipe">
                            <Users size={12} style={{ display: 'inline', marginRight: 3 }} />
                            Individual
                          </span>
                        ) : (
                          <span className="tag-recurso-tipo geral" title="Aplica-se a toda a autoescola">
                            <Building size={12} style={{ display: 'inline', marginRight: 3 }} />
                            Geral / Empresa
                          </span>
                        )}

                        {tipo.computa_ausencia && (
                          <span className="tag-recurso-tipo ausencia" title="Entra nos relatórios de folgas/ausências">
                            Ausência
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="card-tipo-acoes">
                    <button
                      type="button"
                      className="btn-acao-tipo editar"
                      onClick={() => iniciarEdicao(tipo)}
                      title="Editar este tipo"
                    >
                      <Pencil size={15} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      className="btn-acao-tipo excluir"
                      onClick={() => setTipoParaExcluir(tipo)}
                      title="Excluir este tipo"
                    >
                      <Trash2 size={15} />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
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
