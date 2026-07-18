// Notificações locais para lembrete de medicação.
// Não depende de servidor push: enquanto o app estiver aberto (ou em segundo
// plano, se o navegador der suporte a Periodic Background Sync), verifica
// periodicamente se alguma dose está vencida ou perto de vencer e dispara
// uma notificação local via Service Worker.

export async function pedirPermissaoNotificacao() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const resultado = await Notification.requestPermission();
  return resultado;
}

export async function dispararNotificacao(titulo, opcoes = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(titulo, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      ...opcoes,
    });
  } else {
    new Notification(titulo, opcoes);
  }
}

const AVISADOS_KEY = 'fedora-doses-avisadas';

function getAvisados() {
  try {
    return JSON.parse(localStorage.getItem(AVISADOS_KEY) || '{}');
  } catch {
    return {};
  }
}

function marcarAvisado(medicamentoId, proximaDose) {
  const avisados = getAvisados();
  avisados[medicamentoId] = proximaDose;
  localStorage.setItem(AVISADOS_KEY, JSON.stringify(avisados));
}

// Verifica medicamentos e dispara notificação para os que estão vencidos
// ou a menos de 15 minutos de vencer, evitando repetir o aviso pra mesma dose.
export async function verificarDosesPendentes(medicamentos) {
  if (Notification.permission !== 'granted') return;
  const avisados = getAvisados();
  const agora = new Date();

  for (const med of medicamentos) {
    if (!med.ativo || !med.proxima_dose) continue;
    const proxima = new Date(med.proxima_dose);
    const diffMin = (proxima - agora) / (1000 * 60);
    const jaAvisado = avisados[med.id] === med.proxima_dose;

    if (diffMin <= 15 && !jaAvisado) {
      await dispararNotificacao(`💊 Hora do remédio: ${med.nome}`, {
        body: med.dose ? `Dose: ${med.dose}` : 'Verifique o horário da medicação.',
        tag: `med-${med.id}`,
      });
      marcarAvisado(med.id, med.proxima_dose);
    }
  }
}
