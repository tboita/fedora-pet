import { useEffect, useState } from 'react';
import { Droplets, PawPrint, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatarHora, inicioDoDia, fimDoDia, chaveDia, diasAtras, formatarDataCurta, combinarDataComHoraAtual, paraDatetimeLocal } from '../lib/frequencia';
import { faixaXixiIdeal, faixaCocoIdeal, statusFaixa } from '../lib/referencias';
import DateNav from '../components/DateNav';
import TendenciaChart from '../components/TendenciaChart';
import ComparativoIdeal from '../components/ComparativoIdeal';

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
  const [tendenciaXixi, setTendenciaXixi] = useState([]);
  const [tendenciaCoco, setTendenciaCoco] = useState([]);

  async function carregarTendencia() {
    const { data } = await supabase.from('necessidades').select('*')
      .gte('registrado_em', diasAtras(13).toISOString())
      .order('registrado_em', { ascending: true });

    if (data) {
      const xixiPorDia = {};
      const cocoPorDia = {};
      data.forEach(r => {
        const chave = chaveDia(r.registrado_em);
        if (r.tipo === 'xixi') xixiPorDia[chave] = (xixiPorDia[chave] || 0) + 1;
        if (r.tipo === 'coco') cocoPorDia[chave] = (cocoPorDia[chave] || 0) + 1;
      });
      const diasXixi = [];
      const diasCoco = [];
      for (let i = 13; i >= 0; i--) {
        const d = diasAtras(i);
        const chave = chaveDia(d);
        diasXixi.push({ data: formatarDataCurta(d), valor: xixiPorDia[chave] || 0 });
        diasCoco.push({ data: formatarDataCurta(d), valor: cocoPorDia[chave] || 0 });
      }
      setTendenciaXixi(diasXixi);
      setTendenciaCoco(diasCoco);
    }
  }

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
  useEffect(() => { carregarTendencia(); }, []);

  function limparForm() {
    setTipo('xixi');
    setConsistencia('');
    setObs('');
  }

  async function salvar(e) {
    e.preventDefault();
    const { error } = await supabase.from('necessidades').insert({
      registrado_em: combinarDataComHoraAtual(dataSelecionada).toISOString(),
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
    setEditForm({
      tipo: r.tipo,
      consistencia: r.consistencia || '',
      observacoes: r.observacoes || '',
      registrado_em: paraDatetimeLocal(r.registrado_em),
    });
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
      registrado_em: new Date(editForm.registrado_em).toISOString(),
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

      <div className="card">
        <p className="card-title">Comparado ao ideal</p>
        <ComparativoIdeal
          titulo="Xixi hoje"
          valorReal={contagem.xixi || 0}
          unidade="x"
          faixa={faixaXixiIdeal}
          status={statusFaixa(contagem.xixi || 0, faixaXixiIdeal)}
        />
        <ComparativoIdeal
          titulo="Cocô hoje"
          valorReal={contagem.coco || 0}
          unidade="x"
          faixa={faixaCocoIdeal}
          status={statusFaixa(contagem.coco || 0, faixaCocoIdeal)}
        />
        <p style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
          Faixas gerais de referência veterinária. Em gatos com DCR como a Fedora, fazer mais xixi que o normal (poliúria) costuma ser esperado pela doença, não necessariamente um problema agudo — mas mudanças bruscas valem atenção.
        </p>
      </div>

      <div className="card">
        <p className="card-title">Tendência de xixi (14 dias)</p>
        <TendenciaChart dados={tendenciaXixi} cor="#64B5F6" />
      </div>

      <div className="card">
        <p className="card-title">Tendência de cocô (14 dias)</p>
        <TendenciaChart dados={tendenciaCoco} cor="#7FDBA1" />
      </div>

      <div className="card">
        <p className="card-title">
          Registrar
          {!visualizandoHoje && <span className="card-title-meta">Será salvo em {formatarDataCurta(dataSelecionada)}</span>}
        </p>
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
                  <div className="field">
                    <label>Data e hora</label>
                    <input type="datetime-local" value={editForm.registrado_em}
                      onChange={e => setEditForm(f => ({ ...f, registrado_em: e.target.value }))} />
                  </div>
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
