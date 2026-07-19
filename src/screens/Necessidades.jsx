import { useEffect, useState } from 'react';
import { Droplets, PawPrint, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatarHora, inicioDoDia, fimDoDia } from '../lib/frequencia';
import DateNav from '../components/DateNav';

const CONSISTENCIAS = ['Normal', 'Mole', 'Dura', 'Diarreia', 'Com sangue'];

function ehHoje(data) {
  return data.toDateString() === new Date().toDateString();
}

export default function Necessidades({ onToast }) {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [tipo, setTipo] = useState('xixi');
  const [consistencia, setConsistencia] = useState('');
  const [obs, setObs] = useState('');
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('necessidades')
      .select('*')
      .gte('registrado_em', inicioDoDia(dataSelecionada).toISOString())
      .lte('registrado_em', fimDoDia(dataSelecionada).toISOString())
      .order('registrado_em', { ascending: false });
    if (!error) setRegistros(data || []);
    else { onToast?.(`Erro ao carregar: ${error.message}`); console.error(error); }
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [dataSelecionada]);

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
    } else {
      onToast?.(`Erro ao salvar: ${error.message}`);
      console.error(error);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este registro?')) return;
    const { error } = await supabase.from('necessidades').delete().eq('id', id);
    if (!error) {
      onToast?.('Registro excluído');
      carregar();
    } else {
      onToast?.(`Erro ao excluir: ${error.message}`);
      console.error(error);
    }
  }

  function iniciarEdicao(r) {
    setEditandoId(r.id);
    setEditForm({ tipo: r.tipo, consistencia: r.consistencia || '', observacoes: r.observacoes || '' });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditForm({});
  }

  async function salvarEdicao(id) {
    const { error } = await supabase.from('necessidades').update({
      tipo: editForm.tipo,
      consistencia: editForm.tipo === 'coco' && editForm.consistencia ? editForm.consistencia : null,
      observacoes: editForm.observacoes || null,
    }).eq('id', id);
    if (!error) {
      onToast?.('Registro atualizado');
      cancelarEdicao();
      carregar();
    } else {
      onToast?.(`Erro ao atualizar: ${error.message}`);
      console.error(error);
    }
  }

  const contagem = registros.reduce((acc, r) => {
    acc[r.tipo] = (acc[r.tipo] || 0) + 1;
    return acc;
  }, {});

  const visualizandoHoje = ehHoje(dataSelecionada);

  return (
    <div className="screen">
      <DateNav data={dataSelecionada} onChange={setDataSelecionada} />

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--agua-soft)' }}>
            <Droplets size={16} color="var(--agua)" />
          </div>
          <div className="stat-value mono">{contagem.xixi || 0}</div>
          <div className="stat-label">Xixi</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--necessidades-soft)' }}>
            <PawPrint size={16} color="var(--necessidades)" />
          </div>
          <div className="stat-value mono">{contagem.coco || 0}</div>
          <div className="stat-label">Cocô</div>
        </div>
      </div>

      {visualizandoHoje ? (
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
      ) : (
        <div className="card">
          <p className="empty-state" style={{ padding: 0 }}>
            Visualizando um dia passado. Você pode editar ou excluir registros abaixo, mas novos registros só podem ser feitos em "Hoje".
          </p>
        </div>
      )}

      <div className="card">
        <p className="card-title">Histórico do dia</p>
        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : registros.length === 0 ? (
          <p className="empty-state">Nenhum registro nesse dia.</p>
        ) : (
          <div className="entry-list">
            {registros.map(r => (
              editandoId === r.id ? (
                <div key={r.id} className="pending-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div className="btn-row">
                    <button type="button" className={`btn-toggle ${editForm.tipo === 'xixi' ? 'active' : ''}`}
                      onClick={() => setEditForm(f => ({ ...f, tipo: 'xixi' }))}>💧 Xixi</button>
                    <button type="button" className={`btn-toggle ${editForm.tipo === 'coco' ? 'active' : ''}`}
                      onClick={() => setEditForm(f => ({ ...f, tipo: 'coco' }))}>💩 Cocô</button>
                  </div>
                  {editForm.tipo === 'coco' && (
                    <select value={editForm.consistencia} onChange={e => setEditForm(f => ({ ...f, consistencia: e.target.value }))}>
                      <option value="">Selecionar consistência</option>
                      {CONSISTENCIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  <textarea value={editForm.observacoes}
                    onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="observações" />
                  <div className="btn-row">
                    <button type="button" className="btn-cancel" onClick={cancelarEdicao}>Cancelar</button>
                    <button type="button" className="btn-primary" onClick={() => salvarEdicao(r.id)}>Salvar</button>
                  </div>
                </div>
              ) : (
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
                  <button className="btn-icon-danger" onClick={() => iniciarEdicao(r)} title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button className="btn-icon-danger" onClick={() => excluir(r.id)} title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
