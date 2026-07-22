// Calcula a próxima dose com base na frequência do medicamento
export function calcularProximaDose(frequencia, dadoEm, horarioPadrao) {
  const base = new Date(dadoEm);

  if (frequencia === 'diario') {
    const proxima = new Date(base);
    proxima.setDate(proxima.getDate() + 1);
    if (horarioPadrao) {
      const [h, m] = horarioPadrao.split(':');
      proxima.setHours(Number(h), Number(m), 0, 0);
    }
    return proxima;
  }

  if (frequencia === '8h') {
    const proxima = new Date(base);
    proxima.setHours(proxima.getHours() + 8);
    return proxima;
  }

  if (frequencia === '12h') {
    const proxima = new Date(base);
    proxima.setHours(proxima.getHours() + 12);
    return proxima;
  }

  if (frequencia === '48h') {
    const proxima = new Date(base);
    proxima.setHours(proxima.getHours() + 48);
    return proxima;
  }

  if (frequencia === '30dias') {
    const proxima = new Date(base);
    proxima.setDate(proxima.getDate() + 30);
    return proxima;
  }

  return null;
}

export function statusDose(proximaDose) {
  if (!proximaDose) return 'sem-registro';
  const agora = new Date();
  const proxima = new Date(proximaDose);
  const diffHoras = (proxima - agora) / (1000 * 60 * 60);

  if (diffHoras < 0) return 'atrasado';
  if (diffHoras <= 3) return 'proximo';
  return 'ok';
}

export function formatarDataHora(data) {
  if (!data) return '—';
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatarHora(data) {
  if (!data) return '—';
  return new Date(data).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatarData(data) {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function inicioDoDia(data = new Date()) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function chaveDia(data) {
  const d = new Date(data);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function diasAtras(n, base = new Date()) {
  const d = inicioDoDia(base);
  d.setDate(d.getDate() - n);
  return d;
}

export function formatarDataCurta(data) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function horasDesde(data) {
  if (!data) return null;
  return (new Date() - new Date(data)) / (1000 * 60 * 60);
}

// Combina o dia sendo visualizado (ex: um dia passado no histórico) com o
// horário atual do relógio, para que novos registros feitos enquanto se
// navega por um dia anterior caiam corretamente naquele dia.
export function combinarDataComHoraAtual(data) {
  const agora = new Date();
  const combinado = new Date(data);
  combinado.setHours(agora.getHours(), agora.getMinutes(), agora.getSeconds(), agora.getMilliseconds());
  return combinado;
}

export function fimDoDia(data = new Date()) {
  const d = new Date(data);
  d.setHours(23, 59, 59, 999);
  return d;
}

export const rotuloFrequencia = {
  diario: 'Diário',
  '8h': 'A cada 8h',
  '12h': 'A cada 12h',
  '48h': 'A cada 48h',
  '30dias': 'A cada 30 dias',
};
