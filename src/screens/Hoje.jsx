import { useEffect, useState } from 'react';
import { Download, Fish, Droplet, PawPrint, Scale, NotebookPen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { inicioDoDia, fimDoDia, formatarHora, formatarData, statusDose } from '../lib/frequencia';
import StampBadge from '../components/StampBadge';
import { gerarRelatorioPDF } from '../lib/gerarPdf';

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

  const fechadosComida = dados.alimentacao.filter(r => r.quantidade_restante != null);
  const fechadosAgua = dados.agua.filter(r => r.quantidade_restante != null);

  const totalComida = dados.alimentacao.reduce((s, r) => s + Number(r.quantidade_colocada || 0), 0);
  const totalComidaConsumida = fechadosComida.reduce((s, r) => s + (Number(r.quantidade_colocada) - Number(r.quantidade_restante)), 0);
  const totalAgua = dados.agua.reduce((s, r) => s + Number(r.quantidade_colocada || 0), 0);
  const totalAguaConsumida = fechadosAgua.reduce((s, r) => s + (Number(r.quantidade_colocada) - Number(r.quantidade_restante)), 0);

  const xixis = dados.necessidades.filter(n => n.tipo === 'xixi').length;
  const cocos = dados.necessidades.filter(n => n.tipo === 'coco').length;
  const cocosAnormais = dados.necessidades.filter(n => n.tipo === 'coco' && n.consistencia && n.consistencia !== 'Normal');

  const medsPendentes = dados.medicamentos.filter(m => {
    const s = statusDose(m.proxima_dose);
    return s === 'atrasado' || s === 'proximo';
  });

  function baixarPdf() {
    gerarRelatorioPDF({ ...dados, totalComida, totalComidaConsumida, totalAgua, totalAguaConsumida });
  }

  return (
    <div className="screen">
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--comida-soft)' }}>
            <Fish size={16} color="var(--comida)" />
          </div>
          <div className="stat-value mono">{totalComidaConsumida}g</div>
          <div className="stat-label">Comeu hoje</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--agua-soft)' }}>
            <Droplet size={16} color="var(--agua)" />
          </div>
          <div className="stat-value mono">{totalAguaConsumida}ml</div>
          <div className="stat-label">Bebeu hoje</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--necessidades-soft)' }}>
            <PawPrint size={16} color="var(--necessidades)" />
          </div>
          <div className="stat-value mono">💧{xixis} · 💩{cocos}</div>
          <div className="stat-label">Xixi / Cocô</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--peso-soft)' }}>
            <Scale size={16} color="var(--peso)" />
          </div>
          <div className="stat-value mono">{dados.peso ? `${dados.peso.peso_kg}kg` : '—'}</div>
          <div className="stat-label">Peso recente</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">
          Relatório de hoje
          <span className="card-title-meta">{formatarData(new Date())}</span>
        </p>
        <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={baixarPdf}>
          <Download size={16} /> Baixar PDF do dia
        </button>
      </div>

      {cocosAnormais.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--remedios-soft)', background: 'var(--remedios-soft)' }}>
          <p className="card-title" style={{ color: '#D6284A' }}>⚠ Cocô fora do normal hoje</p>
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
                  <span style={{ fontWeight: 700 }}>{m.nome}</span>
                  {status === 'sem-registro' ? (
                    <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>sem registro</span>
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
          <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 10, marginBottom: 0, fontWeight: 600 }}>
            {medsPendentes.length} dose(s) atrasada(s) ou próxima(s) do vencimento.
          </p>
        )}
      </div>

      {dados.comportamento.length > 0 && (
        <div className="card">
          <p className="card-title"><NotebookPen size={15} style={{ marginRight: 6 }} />Notas de hoje</p>
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
