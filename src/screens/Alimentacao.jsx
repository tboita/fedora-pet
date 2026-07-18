import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatarHora, inicioDoDia, fimDoDia } from '../lib/frequencia';

export default function Alimentacao({ onToast }) {
  const [colocada, setColocada] = useState('');
  const [restante, setRestante] = useState('');
  const [obs, setObs] = useState('');
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('alimentacao')
      .select('*')
      .gte('registrado_em', inicioDoDia().toISOString())
      .lte('registrado_em', fimDoDia().toISOString())
      .order('registrado_em', { ascending: false });
    if (!error) setRegistros(data || []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault();
    if (!colocada) return;
    const { error } = await supabase.from('alimentacao').insert({
      quantidade_colocada: Number(colocada),
      quantidade_restante: restante ? Number(restante) : null,
      observacoes: obs || null,
    });
    if (!error) {
      setColocada(''); setRestante(''); setObs('');
      onToast?.('Alimentação registrada');
      carregar();
    }
  }

  const totalColocado = registros.reduce((s, r) => s + Number(r.quantidade_colocada || 0), 0);

  return (
    <div className="screen">
      <div className="card">
        <p className="card-title">Registrar alimentação</p>
        <form onSubmit={salvar}>
          <div className="field-row">
            <div className="field">
              <label>Quantidade colocada (g)</label>
              <input type="number" inputMode="decimal" value={colocada}
                onChange={e => setColocada(e.target.value)} placeholder="ex: 60" required />
            </div>
            <div className="field">
              <label>Quantidade restante (g)</label>
              <input type="number" inputMode="decimal" value={restante}
                onChange={e => setRestante(e.target.value)} placeholder="opcional" />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="opcional" />
          </div>
          <button type="submit" className="btn-primary">Salvar</button>
        </form>
      </div>

      <div className="card">
        <p className="card-title">
          Hoje
          <span className="mono">{totalColocado}g colocados</span>
        </p>
        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : registros.length === 0 ? (
          <p className="empty-state">Nenhum registro ainda hoje.</p>
        ) : (
          <div className="entry-list">
            {registros.map(r => (
              <div key={r.id} className="entry-row">
                <span className="entry-time">{formatarHora(r.registrado_em)}</span>
                <span className="mono">
                  {r.quantidade_colocada}g
                  {r.quantidade_restante != null ? ` · sobrou ${r.quantidade_restante}g` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
