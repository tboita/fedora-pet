import { useEffect, useState } from 'react';
import { Fish, Check, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatarHora, inicioDoDia, fimDoDia } from '../lib/frequencia';
import DateNav from '../components/DateNav';

function ehHoje(data) {
  return data.toDateString() === new Date().toDateString();
}

export default function Alimentacao({ onToast }) {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [tipo, setTipo] = useState('seca');
  const [colocada, setColocada] = useState('');
  const [obs, setObs] = useState('');
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [sobraInputs, setSobraInputs] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('alimentacao')
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
    setColocada('');
    setObs('');
    setTipo('seca');
  }

  async function salvar(e) {
    e.preventDefault();
    if (!colocada) return;
    const { error } = await supabase.from('alimentacao').insert({
      quantidade_colocada: Number(colocada),
      quantidade_restante: null,
      observacoes: obs || null,
      tipo,
    });
    if (!error) {
      limparForm();
      onToast?.('Porção registrada');
      carregar();
    } else {
      onToast?.(`Erro ao salvar: ${error.message}`);
      console.error(error);
    }
  }

  async function registrarSobra(id) {
    const valor = sobraInputs[id];
    if (valor === undefined || valor === '') return;
    const { error } = await supabase.from('alimentacao')
      .update({ quantidade_restante: Number(valor) })
      .eq('id', id);
    if (!error) {
      setSobraInputs(prev => ({ ...prev, [id]: undefined }));
      onToast?.('Sobra registrada');
      carregar();
    } else {
      onToast?.(`Erro ao salvar sobra: ${error.message}`);
      console.error(error);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este registro?')) return;
    const { error } = await supabase.from('alimentacao').delete().eq('id', id);
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
    setEditForm({
      quantidade_colocada: r.quantidade_colocada,
      quantidade_restante: r.quantidade_restante ?? '',
      tipo: r.tipo || 'seca',
      observacoes: r.observacoes || '',
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditForm({});
  }

  async function salvarEdicao(id) {
    const { error } = await supabase.from('alimentacao').update({
      quantidade_colocada: Number(editForm.quantidade_colocada),
      quantidade_restante: editForm.quantidade_restante === '' ? null : Number(editForm.quantidade_restante),
      tipo: editForm.tipo,
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

  const abertos = registros.filter(r => r.quantidade_restante == null);
  const fechados = registros.filter(r => r.quantidade_restante != null);

  const seca = fechados.filter(r => (r.tipo || 'seca') === 'seca');
  const umida = fechados.filter(r => r.tipo === 'umida');
  const totalSecaConsumido = seca.reduce((s, r) => s + (Number(r.quantidade_colocada) - Number(r.quantidade_restante)), 0);
  const totalUmidaConsumido = umida.reduce((s, r) => s + (Number(r.quantidade_colocada) - Number(r.quantidade_restante)), 0);

  const visualizandoHoje = ehHoje(dataSelecionada);

  return (
    <div className="screen">
      <DateNav data={dataSelecionada} onChange={setDataSelecionada} />

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--comida-soft)' }}>
            <Fish size={16} color="var(--comida)" />
          </div>
          <div className="stat-value mono">{totalSecaConsumido}g</div>
          <div className="stat-label">Ração seca comida</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--comida-soft)' }}>
            <Fish size={16} color="var(--comida)" />
          </div>
          <div className="stat-value mono">{totalUmidaConsumido}g</div>
          <div className="stat-label">Ração úmida comida</div>
        </div>
      </div>

      {visualizandoHoje ? (
        <div className="card">
          <p className="card-title">Nova porção</p>
          <form onSubmit={salvar}>
            <div className="btn-row" style={{ marginBottom: 12 }}>
              <button type="button" className={`btn-toggle ${tipo === 'seca' ? 'active' : ''}`}
                onClick={() => setTipo('seca')}>Ração seca</button>
              <button type="button" className={`btn-toggle ${tipo === 'umida' ? 'active' : ''}`}
                onClick={() => setTipo('umida')}>Ração úmida</button>
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Quantidade colocada (g)</label>
              <input type="number" inputMode="decimal" value={colocada}
                onChange={e => setColocada(e.target.value)} placeholder="ex: 20" required />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label>Observações</label>
              <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="ex: pote da esquerda" />
            </div>
            <div className="btn-row">
              <button type="button" className="btn-cancel" onClick={limparForm}>Cancelar</button>
              <button type="submit" className="btn-primary">Registrar</button>
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

      {abertos.length > 0 && (
        <div className="card">
          <p className="card-title">
            Aguardando sobra
            <span className="card-title-meta">{abertos.length} em aberto</span>
          </p>
          {abertos.map(r => (
            <div key={r.id} className="pending-row" style={{ alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {r.quantidade_colocada}g colocados
                  <span style={{ fontWeight: 500, color: 'var(--ink-soft)' }}>
                    {' '}· {r.tipo === 'umida' ? 'úmida' : 'seca'}
                  </span>
                </div>
                <div className="entry-time">{formatarHora(r.registrado_em)}</div>
                {r.observacoes && (
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4, maxWidth: 160 }}>
                    {r.observacoes}
                  </div>
                )}
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
        <p className="card-title">Histórico do dia</p>
        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : registros.length === 0 ? (
          <p className="empty-state">Nenhuma porção registrada nesse dia.</p>
        ) : (
          <div className="entry-list">
            {registros.map(r => (
              editandoId === r.id ? (
                <div key={r.id} className="pending-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div className="btn-row">
                    <button type="button" className={`btn-toggle ${editForm.tipo === 'seca' ? 'active' : ''}`}
                      onClick={() => setEditForm(f => ({ ...f, tipo: 'seca' }))}>Seca</button>
                    <button type="button" className={`btn-toggle ${editForm.tipo === 'umida' ? 'active' : ''}`}
                      onClick={() => setEditForm(f => ({ ...f, tipo: 'umida' }))}>Úmida</button>
                  </div>
                  <div className="field-row" style={{ marginBottom: 0 }}>
                    <div className="field">
                      <label>Colocado (g)</label>
                      <input type="number" value={editForm.quantidade_colocada}
                        onChange={e => setEditForm(f => ({ ...f, quantidade_colocada: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label>Restante (g)</label>
                      <input type="number" value={editForm.quantidade_restante}
                        onChange={e => setEditForm(f => ({ ...f, quantidade_restante: e.target.value }))} placeholder="sem sobra" />
                    </div>
                  </div>
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
                  <span className="mono" style={{ flex: 1, marginLeft: 10 }}>
                    {r.quantidade_colocada}g ({r.tipo === 'umida' ? 'úmida' : 'seca'})
                    {r.quantidade_restante != null
                      ? ` · comeu ${(r.quantidade_colocada - r.quantidade_restante).toFixed(0)}g`
                      : ' · aguardando sobra'}
                    {r.observacoes && (
                      <span style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
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
