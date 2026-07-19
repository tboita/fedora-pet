import { useEffect, useState } from 'react';
import { Droplets, PawPrint, Trash2 } from 'lucide-react';
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

  function limparForm() {
    setTipo('xixi');
    setConsistencia('');
    setObs('');
  }

  async function salvar(e) {
    e.preventDefault();
    const { error } = await supabase.from('necessidades').insert({
      tipo,
      consistencia: tipo === 'coco' && consistencia ? consistencia : null,
      observacoes: obs || null,
    });
    if (!error) {
      limparForm();
      onToast?.('Registrado');
      carregar();
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este registro?')) return;
    const { error } = await supabase.from('necessidades').delete().eq('id', id);
    if (!error) {
      onToast?.('Registro excluído');
      carregar();
    }
  }

  const contagem = registros.reduce((acc, r) => {
    acc[r.tipo] = (acc[r.tipo] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="screen">
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--agua-soft)' }}>
            <Droplets size={16} color="var(--agua)" />
          </div>
          <div className="stat-value mono">{contagem.xixi || 0}</div>
          <div className="stat-label">Xixi hoje</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--necessidades-soft)' }}>
            <PawPrint size={16} color="var(--necessidades)" />
          </div>
          <div className="stat-value mono">{contagem.coco || 0}</div>
          <div className="stat-label">Cocô hoje</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Registrar</p>
        <form onSubmit={salvar}>
          <div className="btn-row" style={{ marginBottom: 12 }}>
            <button type="button"
              className={`btn-toggle ${tipo === 'xixi' ? 'active' : ''}`}
              onClick={() => setTipo('xixi')}>
              💧 Xixi
            </button>
            <button type="button"
              className={`btn-toggle ${tipo === 'coco' ? 'active' : ''}`}
              onClick={() => setTipo('coco')}>
              💩 Cocô
            </button>
          </div>

          {tipo === 'coco' && (
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Consistência</label>
              <select value={consistencia} onChange={e => setConsistencia(e.target.value)}>
                <option value="">Selecionar</option>
                {CONSISTENCIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div className="field" style={{ marginBottom: 12 }}>
            <label>Observações</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="opcional" />
          </div>
          <div className="btn-row">
            <button type="button" className="btn-cancel" onClick={limparForm}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </div>

      <div className="card">
        <p className="card-title">Histórico de hoje</p>
        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : registros.length === 0 ? (
          <p className="empty-state">Nenhum registro ainda hoje.</p>
        ) : (
          <div className="entry-list">
            {registros.map(r => (
              <div key={r.id} className="entry-row" style={{ alignItems: 'flex-start' }}>
                <span className="entry-time">{formatarHora(r.registrado_em)}</span>
                <span style={{ flex: 1, marginLeft: 10 }}>
                  {r.tipo === 'xixi' ? '💧 Xixi' : '💩 Cocô'}
                  {r.consistencia ? ` · ${r.consistencia}` : ''}
                  {r.observacoes && (
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                      {r.observacoes}
                    </span>
                  )}
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
