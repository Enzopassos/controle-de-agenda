import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useAutenticacao } from '../hooks/useAutenticacao';
import logoAutoEscola from '../assets/LOGO_SJ.png';
import './Login.css';

/**
 * Componente corporativo de autenticação (Login e Cadastro de Usuários).
 * Layout executivo split-screen: formulário simétrico à esquerda e painel azul sólido reservado à direita.
 */
export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { entrar, cadastrar, autenticado, carregando: carregandoSessao } = useAutenticacao();

  const destino = location.state?.from?.pathname || '/dashboard';

  // Redireciona caso o usuário já esteja autenticado
  useEffect(() => {
    if (!carregandoSessao && autenticado) {
      navigate(destino, { replace: true });
    }
  }, [autenticado, carregandoSessao, navigate, destino]);

  // Estados dos campos de autenticação
  const [modo, setModo] = useState('login'); // 'login' ou 'cadastro'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estados de controle da interface
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);

  const alternarModo = (novoModo) => {
    setModo(novoModo);
    setMensagemErro(null);
    setMensagemSucesso(null);
    setSenha('');
    setConfirmarSenha('');
  };

  const traduzirMensagemErro = (mensagem) => {
    if (!mensagem) return 'Ocorreu uma falha ao conectar com o serviço de autenticação.';
    const msg = mensagem.toLowerCase();
    if (msg.includes('invalid login credentials')) {
      return 'E-mail ou senha incorretos.';
    }
    if (msg.includes('user already registered') || msg.includes('already registered')) {
      return 'Este e-mail já está em uso. Tente fazer login.';
    }
    if (msg.includes('password should be at least')) {
      return 'A senha deve possuir pelo menos 6 caracteres.';
    }
    if (msg.includes('email not confirmed')) {
      return 'O e-mail cadastrado ainda não foi confirmado na sua caixa de entrada.';
    }
    if (msg.includes('too many requests')) {
      return 'Muitas tentativas consecutivas. Aguarde alguns instantes.';
    }
    return mensagem;
  };

  const tratarEnvioFormulario = async (evento) => {
    evento.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    const emailLimpo = email.trim();
    const nomeLimpo = nome.trim();

    // Validação preventiva Fail-Fast
    if (!emailLimpo || !senha.trim()) {
      setMensagemErro('Por favor, informe seu e-mail e sua senha de acesso.');
      return;
    }

    if (senha.length < 6) {
      setMensagemErro('A senha deve possuir pelo menos 6 caracteres.');
      return;
    }

    if (modo === 'cadastro') {
      if (!nomeLimpo) {
        setMensagemErro('Por favor, informe seu nome completo.');
        return;
      }
      if (senha !== confirmarSenha) {
        setMensagemErro('As senhas informadas não coincidem.');
        return;
      }
    }

    setCarregando(true);

    try {
      if (modo === 'login') {
        await entrar(emailLimpo, senha);
        navigate(destino, { replace: true });
      } else {
        const resposta = await cadastrar(emailLimpo, senha, nomeLimpo);

        if (resposta?.session) {
          setMensagemSucesso('Conta criada com sucesso! Redirecionando...');
          setTimeout(() => {
            navigate(destino, { replace: true });
          }, 1000);
        } else {
          setMensagemSucesso('Conta criada com sucesso! Faça login com suas credenciais para prosseguir.');
          alternarModo('login');
        }
      }
    } catch (erroGenerico) {
      console.error('Falha no processo de autenticação:', erroGenerico);
      setMensagemErro(traduzirMensagemErro(erroGenerico?.message));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="pagina-auth-layout">
      {/* ==================================================================== */}
      {/* 1. COLUNA ESQUERDA: FORMULÁRIO LIMPO E SIMÉTRICO                     */}
      {/* ==================================================================== */}
      <main className="auth-coluna-formulario">
        {/* Bloco Central com Logo e Formulário */}
        <div className="auth-form-conteudo-central">
          {/* Logotipo Centralizado e Simétrico aos Inputs */}
          <header className="auth-form-cabecalho-logo">
            <img src={logoAutoEscola} alt="Auto Escola São João" className="auth-form-logo-img" />
          </header>

          {/* Alternador Sutil (Entrar / Criar Conta) */}
          <div className="auth-tabs-toggle" role="tablist" aria-label="Modo de autenticação">
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'login'}
              className={`auth-tab-item ${modo === 'login' ? 'auth-tab-ativa' : ''}`}
              onClick={() => alternarModo('login')}
            >
              <LogIn size={16} aria-hidden="true" />
              <span>Entrar</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={modo === 'cadastro'}
              className={`auth-tab-item ${modo === 'cadastro' ? 'auth-tab-ativa' : ''}`}
              onClick={() => alternarModo('cadastro')}
            >
              <UserPlus size={16} aria-hidden="true" />
              <span>Criar Conta</span>
            </button>
          </div>

          {/* Cabeçalho do Formulário */}
          <div className="auth-cabecalho-texto">
            <h1 className="auth-titulo-principal">
              {modo === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
            </h1>
            <p className="auth-subtitulo-principal">
              {modo === 'login'
                ? 'Informe suas credenciais para acessar o painel de agendamentos.'
                : 'Cadastre-se para gerenciar colaboradores, agendas e relatórios.'}
            </p>
          </div>

          {/* Mensagens de Alerta em Cores Sólidas */}
          {mensagemErro && (
            <div className="auth-box-alerta auth-box-alerta-erro" role="alert">
              <AlertCircle size={18} className="auth-box-alerta-icone" aria-hidden="true" />
              <span>{mensagemErro}</span>
            </div>
          )}

          {mensagemSucesso && (
            <div className="auth-box-alerta auth-box-alerta-sucesso" role="status">
              <CheckCircle2 size={18} className="auth-box-alerta-icone" aria-hidden="true" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {/* Formulário de Acesso */}
          <form onSubmit={tratarEnvioFormulario} className="auth-formulario" noValidate>
            {/* Campo Nome (apenas no Cadastro) */}
            {modo === 'cadastro' && (
              <div className="auth-grupo-campo">
                <label htmlFor="campo-nome" className="auth-rotulo-campo">
                  Nome Completo
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-icone-lado-esquerdo">
                    <User size={18} aria-hidden="true" />
                  </span>
                  <input
                    id="campo-nome"
                    type="text"
                    className="auth-input-control"
                    placeholder="Seu nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoComplete="name"
                    autoFocus
                    required
                  />
                </div>
              </div>
            )}

            {/* Campo E-mail */}
            <div className="auth-grupo-campo">
              <label htmlFor="campo-email" className="auth-rotulo-campo">
                E-mail
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-icone-lado-esquerdo">
                  <Mail size={18} aria-hidden="true" />
                </span>
                <input
                  id="campo-email"
                  type="email"
                  className="auth-input-control"
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus={modo === 'login'}
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="auth-grupo-campo">
              <label htmlFor="campo-senha" className="auth-rotulo-campo">
                Senha
              </label>
              <div className="auth-input-wrapper">
                <span className="auth-icone-lado-esquerdo">
                  <Lock size={18} aria-hidden="true" />
                </span>
                <input
                  id="campo-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  className="auth-input-control com-toggle"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="auth-botao-visibilidade-senha"
                  onClick={() => setMostrarSenha((anterior) => !anterior)}
                  title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Senha (apenas no Cadastro) */}
            {modo === 'cadastro' && (
              <div className="auth-grupo-campo">
                <label htmlFor="campo-confirmar-senha" className="auth-rotulo-campo">
                  Confirmar Senha
                </label>
                <div className="auth-input-wrapper">
                  <span className="auth-icone-lado-esquerdo">
                    <Lock size={18} aria-hidden="true" />
                  </span>
                  <input
                    id="campo-confirmar-senha"
                    type={mostrarConfirmarSenha ? 'text' : 'password'}
                    className="auth-input-control com-toggle"
                    placeholder="Repita sua senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-botao-visibilidade-senha"
                    onClick={() => setMostrarConfirmarSenha((anterior) => !anterior)}
                    title={mostrarConfirmarSenha ? 'Ocultar senha' : 'Exibir senha'}
                    aria-label={mostrarConfirmarSenha ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {mostrarConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Botão de Ação Sólido */}
            <button
              id="botao-submeter-login"
              type="submit"
              className="auth-botao-principal"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <span className="auth-spinner-carregando" aria-hidden="true" />
                  <span>Acessando...</span>
                </>
              ) : modo === 'login' ? (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              ) : (
                <>
                  <span>Concluir Cadastro</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </button>

            {/* Link Rápido de Alternância */}
            <div className="auth-troca-modo-texto">
              {modo === 'login' ? (
                <p>
                  Não possui uma conta?{' '}
                  <button
                    type="button"
                    className="auth-link-acao"
                    onClick={() => alternarModo('cadastro')}
                  >
                    Criar cadastro
                  </button>
                </p>
              ) : (
                <p>
                  Já é cadastrado?{' '}
                  <button
                    type="button"
                    className="auth-link-acao"
                    onClick={() => alternarModo('login')}
                  >
                    Fazer login
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Rodapé do Formulário */}
        <footer className="auth-form-rodape">
          <span>&copy; {new Date().getFullYear()} Auto Escola São João</span>
          <div className="auth-links-termos">
            <span className="auth-link-termo-item">Segurança</span>
            <span className="auth-link-termo-item">Privacidade</span>
          </div>
        </footer>
      </main>

      {/* ==================================================================== */}
      {/* 2. COLUNA DIREITA: FUNDO AZUL SÓLIDO (RESERVADO PARA FUTURO CONTEÚDO) */}
      {/* ==================================================================== */}
      <aside className="auth-coluna-visual" aria-label="Painel Lateral" />
    </div>
  );
};
