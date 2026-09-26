import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  AppWindow,
} from 'lucide-react';
import { useAutenticacao } from '../hooks/useAutenticacao';
import logoAutoEscola from '../assets/LOGO_SJ.png';
import './Login.css';

export const Login = () => {
  const [modo, setModo] = useState('entrar'); // 'entrar' ou 'cadastrar'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const { entrar, cadastrar, autenticado, carregando } = useAutenticacao();
  const navigate = useNavigate();
  const location = useLocation();

  const destino = location.state?.from?.pathname || '/dashboard';

  // Se já estiver logado, redireciona para o dashboard
  useEffect(() => {
    if (!carregando && autenticado) {
      navigate(destino, { replace: true });
    }
  }, [autenticado, carregando, navigate, destino]);

  const alternarModo = (novoModo) => {
    setModo(novoModo);
    setErro(null);
    setSucesso(null);
  };

  const traduzirMensagemErro = (mensagem) => {
    if (!mensagem) return 'Ocorreu um erro ao processar a solicitação.';
    const msg = mensagem.toLowerCase();
    if (msg.includes('invalid login credentials')) {
      return 'E-mail ou senha incorretos. Verifique suas credenciais.';
    }
    if (msg.includes('user already registered')) {
      return 'Este e-mail já está cadastrado. Tente entrar.';
    }
    if (msg.includes('password should be at least')) {
      return 'A senha deve possuir no mínimo 6 caracteres.';
    }
    if (msg.includes('email not confirmed')) {
      return 'O e-mail cadastrado ainda não foi confirmado na sua caixa de entrada.';
    }
    if (msg.includes('too many requests')) {
      return 'Muitas tentativas consecutivas. Aguarde alguns instantes.';
    }
    return mensagem;
  };

  const lidarComSubmissao = async (e) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    const emailLimpo = email.trim();
    const nomeLimpo = nome.trim();

    if (!emailLimpo || !senha) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (modo === 'cadastrar') {
      if (senha.length < 6) {
        setErro('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      if (senha !== confirmarSenha) {
        setErro('As senhas informadas não coincidem.');
        return;
      }
    }

    setEnviando(true);
    try {
      if (modo === 'entrar') {
        await entrar(emailLimpo, senha);
        navigate(destino, { replace: true });
      } else {
        const resposta = await cadastrar(emailLimpo, senha, nomeLimpo);
        
        // Se o Supabase já logar direto (sem confirmação de e-mail ativada)
        if (resposta?.session) {
          navigate(destino, { replace: true });
        } else {
          // Se o Supabase exigir confirmação por e-mail
          setSucesso('Conta criada com sucesso! Se a confirmação de e-mail estiver ativa, verifique sua caixa de entrada antes de entrar.');
          setModo('entrar');
          setSenha('');
          setConfirmarSenha('');
        }
      }
    } catch (err) {
      console.error('Falha na autenticação:', err);
      setErro(traduzirMensagemErro(err.message));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-pagina">
      <div className="login-card">
        {/* Cabeçalho */}
        <div className="login-cabecalho">
          <div className="login-logo-container">
            <img src={logoAutoEscola} alt="Auto Escola São João" className="login-logo-img" />
          </div>
          <h1 className="login-titulo">Auto Escola São João</h1>
          <p className="login-subtitulo">
            {modo === 'entrar'
              ? 'Acesse para gerenciar colaboradores, agendas e relatórios.'
              : 'Crie uma nova conta de acesso ao sistema.'}
          </p>
        </div>

        {/* Abas de Alternância */}
        <div className="login-abas">
          <button
            type="button"
            className={`btn-aba-login ${modo === 'entrar' ? 'ativa' : ''}`}
            onClick={() => alternarModo('entrar')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`btn-aba-login ${modo === 'cadastrar' ? 'ativa' : ''}`}
            onClick={() => alternarModo('cadastrar')}
          >
            Criar Conta
          </button>
        </div>

        {/* Mensagens de Feedback */}
        {erro && (
          <div className="login-alerta-erro" role="alert">
            <AlertCircle size={16} />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="login-alerta-sucesso" role="status">
            <CheckCircle2 size={16} />
            <span>{sucesso}</span>
          </div>
        )}

        {/* Formulário */}
        <form className="login-formulario" onSubmit={lidarComSubmissao}>
          {modo === 'cadastrar' && (
            <div className="login-campo-grupo">
              <label className="login-rotulo" htmlFor="nome-input">
                Nome Completo
              </label>
              <div className="login-input-envoltura">
                <span className="login-input-icone">
                  <User size={18} />
                </span>
                <input
                  id="nome-input"
                  type="text"
                  className="login-input"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>
          )}

          <div className="login-campo-grupo">
            <label className="login-rotulo" htmlFor="email-input">
              E-mail
            </label>
            <div className="login-input-envoltura">
              <span className="login-input-icone">
                <Mail size={18} />
              </span>
              <input
                id="email-input"
                type="email"
                className="login-input"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="login-campo-grupo">
            <label className="login-rotulo" htmlFor="senha-input">
              Senha
            </label>
            <div className="login-input-envoltura">
              <span className="login-input-icone">
                <Lock size={18} />
              </span>
              <input
                id="senha-input"
                type={mostrarSenha ? 'text' : 'password'}
                className="login-input"
                placeholder={modo === 'cadastrar' ? 'Mínimo de 6 caracteres' : '••••••••'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete={modo === 'cadastrar' ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                className="btn-alternar-senha"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {modo === 'cadastrar' && (
            <div className="login-campo-grupo">
              <label className="login-rotulo" htmlFor="confirmar-senha-input">
                Confirmar Senha
              </label>
              <div className="login-input-envoltura">
                <span className="login-input-icone">
                  <Lock size={18} />
                </span>
                <input
                  id="confirmar-senha-input"
                  type={mostrarSenha ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Repita sua senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-login-submeter"
            disabled={enviando}
          >
            {enviando ? (
              <>
                <RotateCw size={18} className="icone-girando" />
                <span>{modo === 'entrar' ? 'Entrando...' : 'Criando conta...'}</span>
              </>
            ) : (
              <>
                <span>{modo === 'entrar' ? 'Entrar no Sistema' : 'Criar Minha Conta'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Rodapé */}
        <div className="login-rodape">
          <Link to="/widget" className="login-link-widget">
            <AppWindow size={16} />
            <span>Acessar Widget de Área de Trabalho</span>
          </Link>
          <span className="login-texto-ajuda">
            O widget pode ser visualizado sem necessidade de login.
          </span>
        </div>
      </div>
    </div>
  );
};
