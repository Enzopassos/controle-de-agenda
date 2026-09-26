import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { temErro: false, erro: null, infoErro: null };
  }

  static getDerivedStateFromError(error) {
    return { temErro: true, erro: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    this.setState({ infoErro: errorInfo });
  }

  reiniciar = () => {
    this.setState({ temErro: false, erro: null, infoErro: null });
    if (this.props.aoResetar) {
      this.props.aoResetar();
    }
  };

  render() {
    if (this.state.temErro) {
      const conteudoErro = (
        <div
          className="modal-overlay"
          onClick={this.reiniciar}
          style={{ zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal-conteudo"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '2rem',
              maxWidth: '520px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <AlertTriangle size={24} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#7f1d1d' }}>
              Ops! Algo deu errado ao carregar este item
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#b91c1c', marginBottom: '1.25rem' }}>
              {this.state.erro?.message || 'Ocorreu um erro inesperado.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-salvar"
                onClick={this.reiniciar}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#dc2626',
                  borderColor: '#dc2626'
                }}
              >
                <RefreshCw size={16} />
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      );

      if (typeof document !== 'undefined' && document.body) {
        return createPortal(conteudoErro, document.body);
      }
      return conteudoErro;
    }

    return this.props.children;
  }
}
