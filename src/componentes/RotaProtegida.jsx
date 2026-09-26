import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../hooks/useAutenticacao';

export const RotaProtegida = ({ children }) => {
  const { autenticado, carregando } = useAutenticacao();
  const localizacao = useLocation();

  if (carregando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-gradient, #f0f4f8)',
          color: '#64748b',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'girarSpinner 0.8s linear infinite',
          }}
        />
        <style>
          {`
            @keyframes girarSpinner {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
          Carregando informações...
        </span>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: localizacao }} replace />;
  }

  return children ? children : <Outlet />;
};
