import { useEffect, useState } from 'react';
import { Plus, Check, X, Pill, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { calcularProximaDose, statusDose, formatarDataHora, rotuloFrequencia } from '../lib/frequencia';
import StampBadge from '../components/StampBadge';

export default function Medicacao({ onToast }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [nome, setNome] = useState('');
  const [dose, setDose] = useState('');
  const [frequencia, setFrequencia] = useState('diario');
  const [horario, setHorario] = useState('08:00');
  const [obsMedicamento, setObsMedicamento] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('medicamentos')
      .select('*')
      .eq('ativo', true)
      .order('proxima_dose', { ascending: true, nullsFirst: true });
    if (!error) setMedicamentos(data || []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function limparForm() {
    setNome(''); setDose(''); setFrequencia('diario'); setHorario('08:00'); setObsMedicamento('');
    setMostrarForm(false);
  }

  function calcularProximaDoseInicial(freq, horarioPadrao) {
    // Para remédios diários, a primeira dose esperada é hoje no horário
    // escolhido (ou amanhã, se esse horário já passou) — não precisa
    // esperar o primeiro toque em "dado" para começar a agendar e notificar.
    if (freq !== 'diario' || !horarioPadrao) return null;
    const agora = new Date();
    const [h, m] = horarioPadrao.split(':');
    const proxima = new Date(agora);
    proxima.setHours(Number(h), Number(m), 0, 0);
    if (proxima <= agora) proxima.setDate(proxima.getDate() + 1);
    return proxima;
  }

  async function criarMedicamento(e) {
    e.preventDefault();
    if (!nome || salvando) return;
    setSalvando(true);
    const horarioPadrao = frequencia === 'diario' ? horario : null;
    const proximaInicial = calcularProximaDoseInicial(frequencia, horarioPadrao);
    const { error } = await supabase.from('medicamentos').insert({
      nome,
      dose: dose || null,
      frequencia,
      horario_padrao: horarioPadrao,
      proxima_dose: proximaInicial ? proximaInicial.toISOString() : null,
      observacoes: obsMedicamento || null,
    });
    if (!error) {
      limparForm();
      onToast?.('Medicamento cadastrado');
      carregar();
    } else {
      onToast?.(`Erro ao salvar: ${error.message}`);
      console.error(error);
    }
    setSalvando(false);
  }

  async function marcarComoDado(med) {
    const agora = new Date();
    const { error: erroLog } = await supabase.from('medicacao_log').insert({ medicamento_id: med.id, dado_em: agora.toISOString() });
    if (erroLog) {
      onToast?.(`Erro ao registrar dose: ${erroLog.message}`);
      console.error(erroLog);
      return;
    }
    const proxima = calcularProximaDose(med.frequencia, agora, med.horario_padrao);
    const { error: erroUpdate } = await supabase.from('medicamentos')
      .update({ proxima_dose: proxima ? proxima.toISOString() : null })
      .eq('id', med.id);
    if (erroUpdate) {
      onToast?.(`Erro ao atualizar próxima dose: ${erroUpdate.message}`);
      console.error(erroUpdate);
      return;
    }
    onToast?.(`${med.nome}: dose registrada`);
    carregar();
  }

  async function desativar(id) {
    const { error } = await supabase.from('medicamentos').update({ ativo: false }).eq('id', id);
    if (error) {
      onToast?.(`Erro ao remover: ${error.message}`);
      console.error(error);
      return;
    }
    onToast?.('Medicamento removido da lista ativa');
    carregar();
  }

  function iniciarEdicao(med) {
    setEditandoId(med.id);
    setEditForm({
      nome: med.nome,
      dose: med.dose || '',
      frequencia: med.frequencia,
      horario: med.horario_padrao || '08:00',
      observacoes: med.observacoes || '',
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditForm({});
  }

  async function salvarEdicao(med) {
    const horarioPadrao = editForm.frequencia === 'diario' ? editForm.horario : null;
    const atualizacao = {
      nome: editForm.nome,
      dose: editForm.dose || null,
      frequencia: editForm.frequencia,
      horario_padrao: horarioPadrao,
      observacoes: editForm.observacoes || null,
    };
    // Se ainda não tem próxima dose agendada (bug antigo ou remédio novo sem
    // horário), calcula agora que o horário foi definido/corrigido.
    if (!med.proxima_dose && horarioPadrao) {
      const proximaInicial = calcularProximaDoseInicial(editForm.frequencia, horarioPadrao);
      if (proximaInicial) atualizacao.proxima_dose = proximaInicial.toISOString();
    }
    const { error } = await supabase.from('medicamentos').update(atualizacao).eq('id', med.id);
    if (!error) {
      onToast?.('Medicamento atualizado');
      cancelarEdicao();
      carregar();
    } else {
      onToast?.(`Erro ao atualizar: ${error.message}`);
      console.error(error);
    }
  }

  const atrasados = medicamentos.filter(m => statusDose(m.proxima_dose) === 'atrasado').length;

  return (
    <div className="screen">
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--remedios-soft)' }}>
            <Pill size={16} color="var(--remedios)" />
          </div>
          <div className="stat-value mono">{medicamentos.length}</div>
          <div className="stat-label">Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--remedios-soft)' }}>
            <Pill size={16} color="var(--remedios)" />
          </div>
          <div className="stat-value mono">{atrasados}</div>
          <div className="stat-label">Atrasados</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">
          Medicamentos ativos
          <button type="button" className="btn-ghost" style={{ padding: '4px 8px' }}
            onClick={() => setMostrarForm(v => !v)}>
            <Plus size={14} />
          </button>
        </p>

        {mostrarForm && (
          <form onSubmit={criarMedicamento} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Nome do remédio</label>
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="ex: Amoxicilina" required />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Dose</label>
                <input value={dose} onChange={e => setDose(e.target.value)} placeholder="ex: 1 comprimido" />
              </div>
              <div className="field">
                <label>Frequência</label>
                <select value={frequencia} onChange={e => setFrequencia(e.target.value)}>
                  <option value="diario">Diário</option>
                  <option value="8h">A cada 8h</option>
                  <option value="12h">A cada 12h</option>
                  <option value="48h">A cada 48h</option>
                  <option value="30dias">A cada 30 dias</option>
                </select>
              </div>
            </div>
            {frequencia === 'diario' && (
              <div className="field" style={{ marginBottom: 10 }}>
                <label>Horário padrão</label>
                <input type="time" value={horario} onChange={e => setHorario(e.target.value)} />
              </div>
            )}
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Observações</label>
              <textarea value={obsMedicamento} onChange={e => setObsMedicamento(e.target.value)} placeholder="opcional" />
            </div>
            <div className="btn-row">
              <button type="button" className="btn-cancel" onClick={limparForm} disabled={salvando}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={salvando} style={{ opacity: salvando ? 0.6 : 1 }}>
                {salvando ? 'Salvando…' : 'Cadastrar'}
              </button>
            </div>
          </form>
        )}

        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : medicamentos.length === 0 ? (
          <p className="empty-state">Nenhum medicamento cadastrado.</p>
        ) : (
          <div className="entry-list">
            {medicamentos.map(med => {
              const status = statusDose(med.proxima_dose);

              if (editandoId === med.id) {
                return (
                  <div key={med.id} className="pending-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    <div className="field">
                      <label>Nome</label>
                      <input value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} />
                    </div>
                    <div className="field-row" style={{ marginBottom: 0 }}>
                      <div className="field">
                        <label>Dose</label>
                        <input value={editForm.dose} onChange={e => setEditForm(f => ({ ...f, dose: e.target.value }))} />
                      </div>
                      <div className="field">
                        <label>Frequência</label>
                        <select value={editForm.frequencia} onChange={e => setEditForm(f => ({ ...f, frequencia: e.target.value }))}>
                          <option value="diario">Diário</option>
                          <option value="8h">A cada 8h</option>
                          <option value="12h">A cada 12h</option>
                          <option value="48h">A cada 48h</option>
                          <option value="30dias">A cada 30 dias</option>
                        </select>
                      </div>
                    </div>
                    {editForm.frequencia === 'diario' && (
                      <div className="field">
                        <label>Horário padrão</label>
                        <input type="time" value={editForm.horario} onChange={e => setEditForm(f => ({ ...f, horario: e.target.value }))} />
                      </div>
                    )}
                    <textarea value={editForm.observacoes}
                      onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="observações" />
                    <div className="btn-row">
                      <button type="button" className="btn-cancel" onClick={cancelarEdicao}>Cancelar</button>
                      <button type="button" className="btn-primary" onClick={() => salvarEdicao(med)}>Salvar</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={med.id} className="dash-item">
                  <div>
                    <div className="dash-item-label">{med.nome}</div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      {med.dose ? `${med.dose} · ` : ''}{rotuloFrequencia[med.frequencia]}
                      {med.horario_padrao ? ` · ${med.horario_padrao}` : ''}
                    </div>
                    {med.observacoes && (
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>{med.observacoes}</div>
                    )}
                    <div style={{ marginTop: 6 }}>
                      {status === 'sem-registro' ? (
                        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                          Sem dose registrada ainda
                        </span>
                      ) : (
                        <StampBadge status={status}>
                          {status === 'atrasado' ? 'Atrasado' : status === 'proximo' ? 'Em breve' : 'Em dia'}
                          {' · '}{formatarDataHora(med.proxima_dose)}
                        </StampBadge>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => marcarComoDado(med)} className="btn-icon-success" title="Marcar como dado">
                      <Check size={16} />
                    </button>
                    <button onClick={() => iniciarEdicao(med)} className="btn-icon-neutral" title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => desativar(med.id)} className="btn-icon-remove" title="Remover">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
