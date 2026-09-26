/**
 * Utilitários de cores e tipos de registro para o sistema de agenda
 */

export const PALETA_CORES_SUGERIDAS = [
  { rotulo: 'Vermelho Coral', hex: '#ef4444' },
  { rotulo: 'Laranja Férias', hex: '#f97316' },
  { rotulo: 'Âmbar Alerta', hex: '#f59e0b' },
  { rotulo: 'Verde Feriado', hex: '#10b981' },
  { rotulo: 'Verde Esmeralda', hex: '#059669' },
  { rotulo: 'Azul Corporativo', hex: '#3b82f6' },
  { rotulo: 'Índigo Noturno', hex: '#6366f1' },
  { rotulo: 'Roxo Treinamento', hex: '#8b5cf6' },
  { rotulo: 'Rosa Choque', hex: '#ec4899' },
  { rotulo: 'Cinza Neutro', hex: '#64748b' }
];

export const TIPOS_PADRAO_FALLBACK = [
  {
    id: 'folga',
    nome: 'Folga',
    chave: 'folga',
    cor_hex: '#ef4444',
    exige_colaborador: true,
    computa_ausencia: true
  },
  {
    id: 'ferias',
    nome: 'Férias',
    chave: 'ferias',
    cor_hex: '#f97316',
    exige_colaborador: true,
    computa_ausencia: true
  },
  {
    id: 'evento',
    nome: 'Evento da Empresa',
    chave: 'evento',
    cor_hex: '#3b82f6',
    exige_colaborador: false,
    computa_ausencia: false
  },
  {
    id: 'feriado',
    nome: 'Feriado',
    chave: 'feriado',
    cor_hex: '#10b981',
    exige_colaborador: false,
    computa_ausencia: false
  }
];

/**
 * Converte cor Hexadecimal (#RRGGBB ou #RGB) para RGBA com opacidade controlada
 */
export const hexParaRgba = (hex, opacidade = 1) => {
  if (!hex || typeof hex !== 'string') return `rgba(59, 130, 246, ${opacidade})`;

  let hexLimpo = hex.replace('#', '').trim();

  if (hexLimpo.length === 3) {
    hexLimpo = hexLimpo
      .split('')
      .map(char => char + char)
      .join('');
  }

  if (hexLimpo.length !== 6) {
    return `rgba(59, 130, 246, ${opacidade})`;
  }

  const r = parseInt(hexLimpo.substring(0, 2), 16);
  const g = parseInt(hexLimpo.substring(2, 4), 16);
  const b = parseInt(hexLimpo.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacidade})`;
};

/**
 * Retorna estilos dinâmicos de badge para uso em React inline styles
 */
export const obterEstiloBadge = (corHex) => {
  const corBase = corHex || '#3b82f6';
  return {
    backgroundColor: hexParaRgba(corBase, 0.14),
    color: corBase,
    borderLeft: `4px solid ${corBase}`
  };
};

/**
 * Gera uma chave identificadora slug a partir de um nome digitado
 * Ex: "Feriado Municipal" -> "feriado-municipal"
 */
export const gerarChaveSlug = (texto) => {
  if (!texto) return '';
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
