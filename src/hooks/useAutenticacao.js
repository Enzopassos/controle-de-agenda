import { useContext } from 'react';
import { AutenticacaoContexto } from '../contextos/AutenticacaoContexto';

export const useAutenticacao = () => {
  const contexto = useContext(AutenticacaoContexto);

  if (!contexto) {
    throw new Error('useAutenticacao deve ser utilizado dentro de um AutenticacaoProvider');
  }

  return contexto;
};
