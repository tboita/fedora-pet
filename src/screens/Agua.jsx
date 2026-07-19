import { useEffect, useState } from 'react';
import { Droplet, Check, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatarHora, inicioDoDia, fimDoDia, chaveDia, diasAtras, formatarDataCurta } from '../lib/frequencia';
import { faixaAguaIdeal, statusFaixa } from '../lib/referencias';
import DateNav from '../components/DateNav';
import TendenciaChart from '../components/TendenciaChart';
import ComparativoIdeal from '../components/ComparativoIdeal';

function ehHoje(data) {
  return data.toDateString() === new Date().toDateString();
}

export default function Agua({ onToast }) {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [colocada, setColocada] = useState('');
  const [obs, setObs] = useState('');
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [sobraInputs, setSobraInputs] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [tendencia, setTendencia] = useState([]);
  const [pesoAtual, setPesoAtual] = useState(null);

  async function carregarTendenciaEPeso() {
    const [historico, peso] = await Promise.all([
      supabase.from('agua').select('*')
        .gte('registrado_em', diasAtras(13).toISOString())
        .not('quantidade_restante', 'is', null)
        .order('registrado_em', { ascending: true }),
      supabase.from('peso').select('*').order('registrado_em', { ascending: false }).limit(1),
    ]);

    if (peso.data?.[0]) setPesoAtual(peso.data[0].peso_kg);

    if (historico.data) {
      const porDia = {};
      historico.data.forEach(r => {
        const chave = chaveDia(r.registrado_em);
        const consumido = Number(r.quantidade_colocada) - Number(r.quantidade_restante);
        porDia[chave] = (porDia[chave] || 0) + consumido;
      });
      const dias = [];
      for (let i = 13; i >= 0; i--) {
        const d = diasAtras(i);
        const chave = chaveDia(d);
        dias.push({ data: formatarDataCurta(d), valor: Math.round(porDia[chave] || 0) });
      }
      setTendencia(dias);
    }
  }

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('agua')
      .select('*')
      .gte('registrado_em', inicioDoDia(dataSelecionada).toISOString())
      .lte('registrado_em', fimDoDia(dataSelecionada).toISOString())
      .order('registrado_em', { ascending: false });
    if (!error) setRegistros(data || []);
    else { onToast?.(`Erro ao carregar: ${error.message}`); console.error(error); }
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [dataSelecionada]);
  useEffect(() => { carregarTendenciaEPeso(); }, []);

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
    } else {
      onToast?.(`Erro ao salvar: ${error.message}`);
      console.error(error);
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
    } else {
      onToast?.(`Erro ao salvar sobra: ${error.message}`);
      console.error(error);
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este registro?')) return;
    const { error } = await supabase.from('agua').delete().eq('id', id);
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
      observacoes: r.observacoes || '',
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditForm({});
  }

  async function salvarEdicao(id) {
    const { error } = await supabase.from('agua').update({
      quantidade_colocada: Number(editForm.quantidade_colocada),
      quantidade_restante: editForm.quantidade_restante === '' ? null : Number(editForm.quantidade_restante),
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
  const totalColocado = registros.reduce((s, r) => s + Number(r.quantidade_colocada || 0), 0);
  const totalConsumido = fechados.reduce((s, r) => s + (Number(r.quantidade_colocada) - Number(r.quantidade_restante)), 0);

  const visualizandoHoje = ehHoje(dataSelecionada);

  return (
    <div className="screen">
      <DateNav data={dataSelecionada} onChange={setDataSelecionada} />

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--agua-soft)' }}>
            <Droplet size={16} color="var(--agua)" />
          </div>
          <div className="stat-value mono">{totalConsumido}ml</div>
          <div className="stat-label">Bebido</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--agua-soft)' }}>
            <Droplet size={16} color="var(--agua)" />
          </div>
          <div className="stat-value mono">{totalColocado}ml</div>
          <div className="stat-label">Colocado</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Comparado ao ideal</p>
        {pesoAtual ? (
          <ComparativoIdeal
            titulo="Água bebida"
            valorReal={totalConsumido}
            unidade="ml"
            faixa={faixaAguaIdeal(pesoAtual)}
            status={statusFaixa(totalConsumido, faixaAguaIdeal(pesoAtual))}
          />
        ) : (
          <p className="empty-state">Registre o peso da Fedora na aba Peso pra ver a comparação com o ideal.</p>
        )}
        <p style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
          Estimativa geral baseada em referências veterinárias (~45–60ml/kg/dia). Gatos que comem ração úmida costumam beber menos água, pois já se hidratam pela comida. Não substitui orientação veterinária individual.
        </p>
      </div>

      <div className="card">
        <p className="card-title">Tendência (14 dias)</p>
        <TendenciaChart dados={tendencia} cor="#64B5F6" />
      </div>

      {visualizandoHoje ? (
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
                <div style={{ fontWeight: 700, fontSize: 13 }}>{r.quantidade_colocada}ml colocados</div>
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
                  <div className="field-row" style={{ marginBottom: 0 }}>
                    <div className="field">
                      <label>Colocado (ml)</label>
                      <input type="number" value={editForm.quantidade_colocada}
                        onChange={e => setEditForm(f => ({ ...f, quantidade_colocada: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label>Restante (ml)</label>
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
                    {r.quantidade_colocada}ml colocados
                    {r.quantidade_restante != null
                      ? ` · bebeu ${(r.quantidade_colocada - r.quantidade_restante).toFixed(0)}ml`
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
