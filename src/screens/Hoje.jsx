import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { inicioDoDia, fimDoDia, formatarHora, formatarData, statusDose, formatarDataHora, rotuloFrequencia } from '../lib/frequencia';
import StampBadge from '../components/StampBadge';

export default function Hoje() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    const inicio = inicioDoDia().toISOString();
    const fim = fimDoDia().toISOString();

    const [alimentacao, agua, necessidades, medicamentos, peso, comportamento] = await Promise.all([
      supabase.from('alimentacao').select('*').gte('registrado_em', inicio).lte('registrado_em', fim).order('registrado_em'),
      supabase.from('agua').select('*').gte('registrado_em', inicio).lte('registrado_em', fim).order('registrado_em'),
      supabase.from('necessidades').select('*').gte('registrado_em', inicio).lte('registrado_em', fim).order('registrado_em'),
      supabase.from('medicamentos').select('*').eq('ativo', true).order('proxima_dose', { ascending: true, nullsFirst: true }),
      supabase.from('peso').select('*').order('registrado_em', { ascending: false }).limit(1),
      supabase.from('comportamento').select('*').gte('registrado_em', inicio).lte('registrado_em', fim).order('registrado_em'),
    ]);

    setDados({
      alimentacao: alimentacao.data || [],
      agua: agua.data || [],
      necessidades: necessidades.data || [],
      medicamentos: medicamentos.data || [],
      peso: peso.data?.[0] || null,
      comportamento: comportamento.data || [],
    });
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  if (carregando || !dados) {
    return <div className="screen"><p className="empty-state">Carregando relatório do dia…</p></div>;
  }

  const totalComida = dados.alimentacao.reduce((s, r) => s + Number(r.quantidade_colocada || 0), 0);
  const totalAgua = dados.agua.reduce((s, r) => s + Number(r.quantidade_colocada || 0), 0);
  const xixis = dados.necessidades.filter(n => n.tipo === 'xixi').length;
  const cocos = dados.necessidades.filter(n => n.tipo === 'coco').length;
  const cocosAnormais = dados.necessidades.filter(n => n.tipo === 'coco' && n.consistencia && n.consistencia !== 'Normal');

  const medsPendentes = dados.medicamentos.filter(m => {
    const s = statusDose(m.proxima_dose);
    return s === 'atrasado' || s === 'proximo';
  });

  return (
    <div className="screen">
      <div className="card">
        <p className="card-title">
          Relatório de hoje
          <span className="mono">{formatarData(new Date())}</span>
        </p>

        <div className="dash-item">
          <div className="dash-item-label">
            <span className="chip" style={{ background: 'var(--tab-alimentacao)' }} />
            Alimentação
          </div>
          <span className="mono">{totalComida}g · {dados.alimentacao.length}x</span>
        </div>

        <div className="dash-item">
          <div className="dash-item-label">
            <span className="chip" style={{ background: 'var(--tab-agua)' }} />
            Água
          </div>
          <span className="mono">{totalAgua}ml · {dados.agua.length}x</span>
        </div>

        <div className="dash-item">
          <div className="dash-item-label">
            <span className="chip" style={{ background: 'var(--tab-necessidades)' }} />
            Xixi / Cocô
          </div>
          <span className="mono">💧{xixis} · 💩{cocos}</span>
        </div>

        <div className="dash-item">
          <div className="dash-item-label">
            <span className="chip" style={{ background: 'var(--tab-peso)' }} />
            Peso mais recente
          </div>
          <span className="mono">{dados.peso ? `${dados.peso.peso_kg}kg` : '—'}</span>
        </div>

        <div className="dash-item">
          <div className="dash-item-label">
            <span className="chip" style={{ background: 'var(--tab-comportamento)' }} />
            Notas de comportamento
          </div>
          <span className="mono">{dados.comportamento.length}</span>
        </div>
      </div>

      {cocosAnormais.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--rust-soft)' }}>
          <p className="card-title" style={{ color: 'var(--rust)' }}>⚠ Cocô fora do normal hoje</p>
          <div className="entry-list">
            {cocosAnormais.map(c => (
              <div key={c.id} className="entry-row">
                <span className="entry-time">{formatarHora(c.registrado_em)}</span>
                <span>{c.consistencia}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <p className="card-title">Medicação — status</p>
        {dados.medicamentos.length === 0 ? (
          <p className="empty-state">Nenhum medicamento cadastrado.</p>
        ) : (
          <div className="entry-list">
            {dados.medicamentos.map(m => {
              const status = statusDose(m.proxima_dose);
              return (
                <div key={m.id} className="entry-row">
                  <span style={{ fontWeight: 600 }}>{m.nome}</span>
                  {status === 'sem-registro' ? (
                    <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>sem registro</span>
                  ) : (
                    <StampBadge status={status}>
                      {status === 'atrasado' ? 'Atrasado' : status === 'proximo' ? 'Em breve' : 'Em dia'}
                    </StampBadge>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {medsPendentes.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--rust)', marginTop: 10, marginBottom: 0 }}>
            {medsPendentes.length} dose(s) atrasada(s) ou próxima(s) do vencimento.
          </p>
        )}
      </div>

      {dados.comportamento.length > 0 && (
        <div className="card">
          <p className="card-title">Notas de hoje</p>
          <div className="entry-list">
            {dados.comportamento.map(c => (
              <div key={c.id} className="entry-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
                <span className="entry-time">{formatarHora(c.registrado_em)}</span>
                <span>{c.observacoes}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
