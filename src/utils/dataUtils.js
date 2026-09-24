export const obterDiasDoMes = (ano, mes) => {
  const data = new Date(ano, mes, 1);
  const dias = [];
  
  // Preencher dias vazios antes do dia 1 (para o calendário alinhar corretamente)
  const diaDaSemanaInicia = data.getDay();
  for (let i = 0; i < diaDaSemanaInicia; i++) {
    dias.push(null);
  }

  // Preencher os dias do mês
  while (data.getMonth() === mes) {
    dias.push(new Date(data));
    data.setDate(data.getDate() + 1);
  }

  return dias;
};

export const formatarData = (data) => {
  if (!data) return '';
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${ano}-${mes}-${dia}`;
};

export const isMesmoDia = (data1, data2Str) => {
  if (!data1 || !data2Str) return false;
  return formatarData(data1) === data2Str;
};

export const nomesDosMeses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
