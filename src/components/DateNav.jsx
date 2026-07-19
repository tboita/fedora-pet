import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatarData } from '../lib/frequencia';

function ehHoje(data) {
  const hoje = new Date();
  return data.toDateString() === hoje.toDateString();
}

export default function DateNav({ data, onChange }) {
  function irParaAnterior() {
    const nova = new Date(data);
    nova.setDate(nova.getDate() - 1);
    onChange(nova);
  }

  function irParaProximo() {
    const nova = new Date(data);
    nova.setDate(nova.getDate() + 1);
    onChange(nova);
  }

  function irParaHoje() {
    onChange(new Date());
  }

  const hoje = ehHoje(data);
  const amanha = new Date(data);
  amanha.setDate(amanha.getDate() + 1);
  const podeAvancar = amanha <= new Date();

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 14 }}>
      <button className="btn-icon-neutral" onClick={irParaAnterior} title="Dia anterior">
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={irParaHoje}
        style={{ background: 'transparent', color: 'var(--ink)', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, padding: '4px 8px' }}>
        {hoje ? 'Hoje' : formatarData(data)}
      </button>
      <button className="btn-icon-neutral"
        onClick={irParaProximo} disabled={!podeAvancar} title="Próximo dia">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
