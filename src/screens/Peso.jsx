import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { formatarData } from '../lib/frequencia';

export default function Peso({ onToast }) {
  const [pesoKg, setPesoKg] = useState('');
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('peso')
      .select('*')
      .order('registrado_em', { ascending: true });
    if (!error) setRegistros(data || []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault();
    if (!pesoKg) return;
    const { error } = await supabase.from('peso').insert({ peso_kg: Number(pesoKg) });
    if (!error) {
      setPesoKg('');
      onToast?.('Peso registrado');
      carregar();
    }
  }

  function limparForm() {
    setPesoKg('');
  }

  const dadosGrafico = registros.map(r => ({
    data: formatarData(r.registrado_em),
    peso: Number(r.peso_kg),
  }));

  const ultimo = registros[registros.length - 1];
  const anterior = registros[registros.length - 2];
  const variacao = ultimo && anterior ? (ultimo.peso_kg - anterior.peso_kg).toFixed(2) : null;

  return (
    <div className="screen">
      <div className="card">
        <p className="card-title">Registrar peso</p>
        <form onSubmit={salvar}>
          <div className="field-row">
            <div className="field">
              <label>Peso (kg)</label>
              <input type="number" step="0.01" inputMode="decimal" value={pesoKg}
                onChange={e => setPesoKg(e.target.value)} placeholder="ex: 4.20" required />
            </div>
          </div>
          <div className="btn-row">
            <button type="button" className="btn-cancel" onClick={limparForm}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </div>

      <div className="card">
        <p className="card-title">
          Evolução
          {variacao != null && (
            <span className="mono" style={{ color: variacao > 0 ? 'var(--olive)' : variacao < 0 ? 'var(--rust)' : 'var(--ink-soft)' }}>
              {variacao > 0 ? '+' : ''}{variacao}kg desde o último
            </span>
          )}
        </p>
        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : registros.length < 2 ? (
          <p className="empty-state">Registre pelo menos 2 medições para ver o gráfico.</p>
        ) : (
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosGrafico}>
                <CartesianGrid stroke="var(--paper-line)" strokeDasharray="3 3" />
                <XAxis dataKey="data" tick={{ fontSize: 10 }} stroke="var(--ink-soft)" />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="var(--ink-soft)" />
                <Tooltip />
                <Line type="monotone" dataKey="peso" stroke="var(--plum)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {registros.length > 0 && (
        <div className="card">
          <p className="card-title">Histórico</p>
          <div className="entry-list">
            {[...registros].reverse().slice(0, 10).map(r => (
              <div key={r.id} className="entry-row">
                <span className="entry-time">{formatarData(r.registrado_em)}</span>
                <span className="mono">{r.peso_kg}kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
