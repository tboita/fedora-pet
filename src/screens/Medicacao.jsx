import { useEffect, useState } from 'react';
import { Plus, Check, X, Pill } from 'lucide-react';
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

  async function criarMedicamento(e) {
    e.preventDefault();
    if (!nome) return;
    const { error } = await supabase.from('medicamentos').insert({
      nome,
      dose: dose || null,
      frequencia,
      horario_padrao: frequencia === 'diario' ? horario : null,
      proxima_dose: null,
      observacoes: obsMedicamento || null,
    });
    if (!error) {
      limparForm();
      onToast?.('Medicamento cadastrado');
      carregar();
    }
  }

  async function marcarComoDado(med) {
    const agora = new Date();
    await supabase.from('medicacao_log').insert({ medicamento_id: med.id, dado_em: agora.toISOString() });
    const proxima = calcularProximaDose(med.frequencia, agora, med.horario_padrao);
    await supabase.from('medicamentos')
      .update({ proxima_dose: proxima ? proxima.toISOString() : null })
      .eq('id', med.id);
    onToast?.(`${med.nome}: dose registrada`);
    carregar();
  }

  async function desativar(id) {
    await supabase.from('medicamentos').update({ ativo: false }).eq('id', id);
    onToast?.('Medicamento removido da lista ativa');
    carregar();
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
              <button type="button" className="btn-cancel" onClick={limparForm}>Cancelar</button>
              <button type="submit" className="btn-primary">Cadastrar</button>
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
              return (
                <div key={med.id} className="dash-item">
                  <div>
                    <div className="dash-item-label">{med.nome}</div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      {med.dose ? `${med.dose} · ` : ''}{rotuloFrequencia[med.frequencia]}
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
