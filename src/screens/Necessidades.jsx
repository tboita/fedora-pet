import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatarHora, inicioDoDia, fimDoDia } from '../lib/frequencia';

const CONSISTENCIAS = ['Normal', 'Mole', 'Dura', 'Diarreia', 'Com sangue'];

export default function Necessidades({ onToast }) {
  const [tipo, setTipo] = useState('xixi');
  const [consistencia, setConsistencia] = useState('');
  const [obs, setObs] = useState('');
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('necessidades')
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
    const { error } = await supabase.from('necessidades').insert({
      tipo,
      consistencia: tipo === 'coco' && consistencia ? consistencia : null,
      observacoes: obs || null,
    });
    if (!error) {
      setConsistencia(''); setObs('');
      onToast?.('Registrado');
      carregar();
    }
  }

  const contagem = registros.reduce((acc, r) => {
    acc[r.tipo] = (acc[r.tipo] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="screen">
      <div className="card">
        <p className="card-title">Registrar</p>
        <form onSubmit={salvar}>
          <div className="field-row">
            <button type="button"
              className={tipo === 'xixi' ? 'btn-primary' : 'btn-ghost'}
              style={{ flex: 1 }}
              onClick={() => setTipo('xixi')}>
              💧 Xixi
            </button>
            <button type="button"
              className={tipo === 'coco' ? 'btn-primary' : 'btn-ghost'}
              style={{ flex: 1 }}
              onClick={() => setTipo('coco')}>
              💩 Cocô
            </button>
          </div>

          {tipo === 'coco' && (
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Consistência</label>
              <select value={consistencia} onChange={e => setConsistencia(e.target.value)}>
                <option value="">Selecionar</option>
                {CONSISTENCIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

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
          <span className="mono">💧 {contagem.xixi || 0} · 💩 {contagem.coco || 0}</span>
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
                <span>
                  {r.tipo === 'xixi' ? '💧 Xixi' : '💩 Cocô'}
                  {r.consistencia ? ` · ${r.consistencia}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
