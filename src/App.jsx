import { useEffect, useRef, useState } from 'react';
import TabBar from './components/TabBar';
import Hoje from './screens/Hoje';
import Alimentacao from './screens/Alimentacao';
import Agua from './screens/Agua';
import Necessidades from './screens/Necessidades';
import Medicacao from './screens/Medicacao';
import Peso from './screens/Peso';
import Comportamento from './screens/Comportamento';
import { pedirPermissaoNotificacao, verificarDosesPendentes } from './lib/notificacoes';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [aba, setAba] = useState('hoje');
  const [toast, setToast] = useState('');
  const toastTimeout = useRef(null);

  function mostrarToast(msg) {
    setToast(msg);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(''), 2500);
  }

  // Pede permissão de notificação uma vez e verifica doses pendentes periodicamente
  useEffect(() => {
    pedirPermissaoNotificacao();

    async function checar() {
      const { data } = await supabase.from('medicamentos').select('*').eq('ativo', true);
      if (data) verificarDosesPendentes(data);
    }

    checar();
    const intervalo = setInterval(checar, 5 * 60 * 1000); // a cada 5 minutos, enquanto o app está aberto
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="app-shell">
      <header className="brand-header">
        <div className="brand-left">
          <div className="brand-avatar">F</div>
          <div>
            <h1>Fedora</h1>
            <div className="brand-sub">painel de cuidados</div>
          </div>
        </div>
      </header>

      {aba === 'hoje' && <Hoje />}
      {aba === 'alimentacao' && <Alimentacao onToast={mostrarToast} />}
      {aba === 'agua' && <Agua onToast={mostrarToast} />}
      {aba === 'necessidades' && <Necessidades onToast={mostrarToast} />}
      {aba === 'medicacao' && <Medicacao onToast={mostrarToast} />}
      {aba === 'peso' && <Peso onToast={mostrarToast} />}
      {aba === 'comportamento' && <Comportamento onToast={mostrarToast} />}

      {toast && <div className="toast">{toast}</div>}

      <TabBar ativa={aba} onChange={setAba} />
    </div>
  );
}
