import { useEffect, useState } from 'react';
import { Droplet, Check, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatarHora, inicioDoDia, fimDoDia } from '../lib/frequencia';

export default function Agua({ onToast }) {
  const [colocada, setColocada] = useState('');
  const [obs, setObs] = useState('');
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [sobraInputs, setSobraInputs] = useState({});

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('agua')
      .select('*')
      .gte('registrado_em', inicioDoDia().toISOString())
      .lte('registrado_em', fimDoDia().toISOString())
      .order('registrado_em', { ascending: false });
    if (!error) setRegistros(data || []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function limparForm() {
    setColocada('');
    setObs('');
  }

  async function salvar(e) {
    e.preventDefault();
    if (!colocada) return;
    const { error } = await supabase.from('agua').insert({
      quantidade_colocada: Number(colocada),
      quantidade_restante: null,
      observacoes: obs || null,
    });
    if (!error) {
      limparForm();
      onToast?.('Água registrada');
      carregar();
    }
  }

  async function registrarSobra(id) {
    const valor = sobraInputs[id];
    if (valor === undefined || valor === '') return;
    const { error } = await supabase.from('agua')
      .update({ quantidade_restante: Number(valor) })
      .eq('id', id);
    if (!error) {
      setSobraInputs(prev => ({ ...prev, [id]: undefined }));
      onToast?.('Sobra registrada');
      carregar();
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este registro?')) return;
    const { error } = await supabase.from('agua').delete().eq('id', id);
    if (!error) {
      onToast?.('Registro excluído');
      carregar();
    }
  }

  const abertos = registros.filter(r => r.quantidade_restante == null);
  const fechados = registros.filter(r => r.quantidade_restante != null);
  const totalColocado = registros.reduce((s, r) => s + Number(r.quantidade_colocada || 0), 0);
  const totalConsumido = fechados.reduce((s, r) => s + (Number(r.quantidade_colocada) - Number(r.quantidade_restante)), 0);

  return (
    <div className="screen">
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--agua-soft)' }}>
            <Droplet size={16} color="var(--agua)" />
          </div>
          <div className="stat-value mono">{totalConsumido}ml</div>
          <div className="stat-label">Bebido hoje</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--agua-soft)' }}>
            <Droplet size={16} color="var(--agua)" />
          </div>
          <div className="stat-value mono">{totalColocado}ml</div>
          <div className="stat-label">Colocado hoje</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Nova porção</p>
        <form onSubmit={salvar}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Quantidade colocada (ml)</label>
            <input type="number" inputMode="decimal" value={colocada}
              onChange={e => setColocada(e.target.value)} placeholder="ex: 200" required />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="opcional" />
          </div>
          <div className="btn-row">
            <button type="button" className="btn-cancel" onClick={limparForm}>Cancelar</button>
            <button type="submit" className="btn-primary">Registrar</button>
          </div>
        </form>
      </div>

      {abertos.length > 0 && (
        <div className="card">
          <p className="card-title">
            Aguardando sobra
            <span className="card-title-meta">{abertos.length} em aberto</span>
          </p>
          {abertos.map(r => (
            <div key={r.id} className="pending-row">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{r.quantidade_colocada}ml colocados</div>
                <div className="entry-time">{formatarHora(r.registrado_em)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="number" inputMode="decimal" placeholder="sobrou"
                  value={sobraInputs[r.id] ?? ''}
                  onChange={e => setSobraInputs(prev => ({ ...prev, [r.id]: e.target.value }))} />
                <button className="btn-primary" style={{ padding: '10px 12px' }}
                  onClick={() => registrarSobra(r.id)}>
                  <Check size={16} />
                </button>
                <button className="btn-icon-danger" onClick={() => excluir(r.id)} title="Excluir">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <p className="card-title">Histórico de hoje</p>
        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : registros.length === 0 ? (
          <p className="empty-state">Nenhuma porção registrada ainda hoje.</p>
        ) : (
          <div className="entry-list">
            {registros.map(r => (
              <div key={r.id} className="entry-row">
                <span className="entry-time">{formatarHora(r.registrado_em)}</span>
                <span className="mono" style={{ flex: 1, marginLeft: 10 }}>
                  {r.quantidade_colocada}ml colocados
                  {r.quantidade_restante != null
                    ? ` · bebeu ${(r.quantidade_colocada - r.quantidade_restante).toFixed(0)}ml`
                    : ' · aguardando sobra'}
                </span>
                <button className="btn-icon-danger" onClick={() => excluir(r.id)} title="Excluir">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
