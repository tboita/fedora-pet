import { useEffect, useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatarDataHora, paraDatetimeLocal } from '../lib/frequencia';

export default function Comportamento({ onToast }) {
  const [nota, setNota] = useState('');
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('comportamento')
      .select('*')
      .order('registrado_em', { ascending: false })
      .limit(30);
    if (!error) setRegistros(data || []);
    else { onToast?.(`Erro ao carregar: ${error.message}`); console.error(error); }
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(e) {
    e.preventDefault();
    if (!nota.trim()) return;
    const { error } = await supabase.from('comportamento').insert({ observacoes: nota.trim() });
    if (!error) {
      setNota('');
      onToast?.('Nota registrada');
      carregar();
    } else {
      onToast?.(`Erro ao salvar: ${error.message}`);
      console.error(error);
    }
  }

  function limparForm() {
    setNota('');
  }

  async function excluir(id) {
    if (!window.confirm('Excluir esta nota?')) return;
    const { error } = await supabase.from('comportamento').delete().eq('id', id);
    if (!error) {
      onToast?.('Nota excluída');
      carregar();
    } else {
      onToast?.(`Erro ao excluir: ${error.message}`);
      console.error(error);
    }
  }

  function iniciarEdicao(r) {
    setEditandoId(r.id);
    setEditForm({
      observacoes: r.observacoes,
      registrado_em: paraDatetimeLocal(r.registrado_em),
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditForm({});
  }

  async function salvarEdicao(id) {
    if (!editForm.observacoes.trim()) return;
    const { error } = await supabase.from('comportamento').update({
      observacoes: editForm.observacoes.trim(),
      registrado_em: new Date(editForm.registrado_em).toISOString(),
    }).eq('id', id);
    if (!error) {
      onToast?.('Nota atualizada');
      cancelarEdicao();
      carregar();
    } else {
      onToast?.(`Erro ao atualizar: ${error.message}`);
      console.error(error);
    }
  }

  return (
    <div className="screen">
      <div className="card">
        <p className="card-title">Registrar comportamento</p>
        <form onSubmit={salvar}>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Observação</label>
            <textarea value={nota} onChange={e => setNota(e.target.value)}
              placeholder="ex: agitada à tarde, recusou comida no jantar…" required />
          </div>
          <div className="btn-row">
            <button type="button" className="btn-cancel" onClick={limparForm}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </div>

      <div className="card">
        <p className="card-title">Notas recentes</p>
        {carregando ? (
          <p className="empty-state">Carregando…</p>
        ) : registros.length === 0 ? (
          <p className="empty-state">Nenhuma nota registrada ainda.</p>
        ) : (
          <div className="entry-list">
            {registros.map(r => (
              editandoId === r.id ? (
                <div key={r.id} className="pending-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div className="field">
                    <label>Data e hora</label>
                    <input type="datetime-local" value={editForm.registrado_em}
                      onChange={e => setEditForm(f => ({ ...f, registrado_em: e.target.value }))} />
                  </div>
                  <textarea value={editForm.observacoes}
                    onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))} />
                  <div className="btn-row">
                    <button type="button" className="btn-cancel" onClick={cancelarEdicao}>Cancelar</button>
                    <button type="button" className="btn-primary" onClick={() => salvarEdicao(r.id)}>Salvar</button>
                  </div>
                </div>
              ) : (
                <div key={r.id} className="entry-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span className="entry-time">{formatarDataHora(r.registrado_em)}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon-danger" onClick={() => iniciarEdicao(r)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon-danger" onClick={() => excluir(r.id)} title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <span>{r.observacoes}</span>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
