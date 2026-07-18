import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatarDataHora } from '../lib/frequencia';

export default function Comportamento({ onToast }) {
  const [nota, setNota] = useState('');
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('comportamento')
      .select('*')
      .order('registrado_em', { ascending: false })
      .limit(30);
    if (!error) setRegistros(data || []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault();
    if (!nota.trim()) return;
    const { error } = await supabase.from('comportamento').insert({ observacoes: nota.trim() });
    if (!error) {
      setNota('');
      onToast?.('Nota registrada');
      carregar();
    }
  }

  function limparForm() {
    setNota('');
  }

  return (
    <div className="screen">
      <div className="card">
        <p className="card-title">Registrar comportamento</p>
        <form onSubmit={salvar}>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Observação</label>
            <textarea value={nota} onChange={e => setNota(e.target.value)}
              placeholder="ex: agitada à tarde, recusou comida no jantar…" required />
          </div>
          <div className="btn-row">
            <button type="button" className="btn-cancel" onClick={limparForm}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </div>

      <div className="card">
        <p className="card-title">Notas recentes</p>
        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : registros.length === 0 ? (
          <p className="empty-state">Nenhuma nota registrada ainda.</p>
        ) : (
          <div className="entry-list">
            {registros.map(r => (
              <div key={r.id} className="entry-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
                <span className="entry-time">{formatarDataHora(r.registrado_em)}</span>
                <span>{r.observacoes}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
