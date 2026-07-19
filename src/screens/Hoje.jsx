import { useEffect, useState } from 'react';
import { Download, Fish, Droplet, PawPrint, Scale, NotebookPen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { inicioDoDia, fimDoDia, formatarHora, formatarData, statusDose } from '../lib/frequencia';
import { faixaAguaIdeal, faixaRacaoSecaIdeal, faixaXixiIdeal, faixaCocoIdeal, statusFaixa, FONTES_CIENTIFICAS, CONTEXTO_CLINICO } from '../lib/referencias';
import StampBadge from '../components/StampBadge';
import DateNav from '../components/DateNav';
import ComparativoIdeal from '../components/ComparativoIdeal';
import AlertaJejum from '../components/AlertaJejum';
import { gerarRelatorioPDF } from '../lib/gerarPdf';

function ehHoje(data) {
  return data.toDateString() === new Date().toDateString();
}

export default function Hoje() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [ultimaAlimentacao, setUltimaAlimentacao] = useState(null);

  async function carregarUltimaAlimentacao() {
    const { data } = await supabase.from('alimentacao').select('*')
      .order('registrado_em', { ascending: false }).limit(1);
    if (data?.[0]) setUltimaAlimentacao(data[0]);
  }

  async function carregar() {
    setCarregando(true);
    const inicio = inicioDoDia(dataSelecionada).toISOString();
    const fim = fimDoDia(dataSelecionada).toISOString();

    const [alimentacao, agua, necessidades, medicamentos, peso, comportamento] = await Promise.all([
      supabase.from('alimentacao').select('*').gte('registrado_em', inicio).lte('registrado_em', fim).order('registrado_em'),
      supabase.from('agua').select('*').gte('registrado_em', inicio).lte('registrado_em', fim).order('registrado_em'),
      supabase.from('necessidades').select('*').gte('registrado_em', inicio).lte('registrado_em', fim).order('registrado_em'),
      supabase.from('medicamentos').select('*').eq('ativo', true).order('proxima_dose', { ascending: true, nullsFirst: true }),
      supabase.from('peso').select('*').lte('registrado_em', fim).order('registrado_em', { ascending: false }).limit(1),
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

  useEffect(() => { carregar(); }, [dataSelecionada]);
  useEffect(() => { carregarUltimaAlimentacao(); }, []);

  if (carregando || !dados) {
    return (
      <div className="screen">
        <DateNav data={dataSelecionada} onChange={setDataSelecionada} />
        <p className="empty-state">Carregando relatório do dia…</p>
      </div>
    );
  }

  const fechadosComida = dados.alimentacao.filter(r => r.quantidade_restante != null);
  const fechadosAgua = dados.agua.filter(r => r.quantidade_restante != null);

  const secaFechada = fechadosComida.filter(r => (r.tipo || 'seca') === 'seca');
  const umidaFechada = fechadosComida.filter(r => r.tipo === 'umida');
  const totalSecaConsumida = secaFechada.reduce((s, r) => s + (Number(r.quantidade_colocada) - Number(r.quantidade_restante)), 0);
  const totalUmidaConsumida = umidaFechada.reduce((s, r) => s + (Number(r.quantidade_colocada) - Number(r.quantidade_restante)), 0);
  const totalComidaConsumida = totalSecaConsumida + totalUmidaConsumida;
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
    gerarRelatorioPDF({ ...dados, totalSecaConsumida, totalUmidaConsumida, totalComidaConsumida, totalAgua, totalAguaConsumida, dataRelatorio: dataSelecionada });
  }

  return (
    <div className="screen">
      <DateNav data={dataSelecionada} onChange={setDataSelecionada} />

      {ehHoje(dataSelecionada) && <AlertaJejum ultimaAlimentacao={ultimaAlimentacao} />}

      <div className="card" style={{ padding: 14 }}>
        <p className="card-title" style={{ marginBottom: 8 }}>Contexto clínico</p>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span><strong style={{ color: 'var(--ink)' }}>IRIS:</strong> {CONTEXTO_CLINICO.estagioIris}</span>
          <span><strong style={{ color: 'var(--ink)' }}>Creatinina:</strong> {CONTEXTO_CLINICO.ultimaCreatinina}</span>
          <span><strong style={{ color: 'var(--ink)' }}>Ureia:</strong> {CONTEXTO_CLINICO.ultimaUreia}</span>
          <span><strong style={{ color: 'var(--ink)' }}>UPC:</strong> {CONTEXTO_CLINICO.upc}</span>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--comida-soft)' }}>
            <Fish size={16} color="var(--comida)" />
          </div>
          <div className="stat-value mono">{totalComidaConsumida}g</div>
          <div className="stat-label">Comeu (seca {totalSecaConsumida}g · úmida {totalUmidaConsumida}g)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--agua-soft)' }}>
            <Droplet size={16} color="var(--agua)" />
          </div>
          <div className="stat-value mono">{totalAguaConsumida}ml</div>
          <div className="stat-label">Bebeu</div>
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
          <div className="stat-label">Peso mais recente</div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">
          Relatório
          <span className="card-title-meta">{formatarData(dataSelecionada)}</span>
        </p>
        <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={baixarPdf}>
          <Download size={16} /> Baixar PDF deste dia
        </button>
      </div>

      <div className="card">
        <p className="card-title">Consumo x ideal (baseado no peso)</p>
        {dados.peso ? (
          <>
            <ComparativoIdeal
              titulo="Ração seca"
              valorReal={totalSecaConsumida}
              unidade="g"
              faixa={faixaRacaoSecaIdeal(dados.peso.peso_kg)}
              status={statusFaixa(totalSecaConsumida, faixaRacaoSecaIdeal(dados.peso.peso_kg))}
            />
            <ComparativoIdeal
              titulo="Água"
              valorReal={totalAguaConsumida}
              unidade="ml"
              faixa={faixaAguaIdeal(dados.peso.peso_kg)}
              status={statusFaixa(totalAguaConsumida, faixaAguaIdeal(dados.peso.peso_kg))}
            />
            <ComparativoIdeal
              titulo="Xixi"
              valorReal={xixis}
              unidade="x"
              faixa={faixaXixiIdeal}
              status={statusFaixa(xixis, faixaXixiIdeal)}
            />
            <ComparativoIdeal
              titulo="Cocô"
              valorReal={cocos}
              unidade="x"
              faixa={faixaCocoIdeal}
              status={statusFaixa(cocos, faixaCocoIdeal)}
            />
            <p style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
              Estimativas consideram a DCR da Fedora — água tratada como piso mínimo (mais é protetor, não excesso). A equipe médica orientou que agora não é hora de dieta: a prioridade é ela comer, não bater a meta de gramas. Não substituem orientação veterinária individual.
            </p>
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 11, color: 'var(--ink-soft)', cursor: 'pointer' }}>Fontes científicas (revisadas por pares)</summary>
              <ul style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6, paddingLeft: 16 }}>
                {FONTES_CIENTIFICAS.map(fonte => <li key={fonte} style={{ marginBottom: 3 }}>{fonte}</li>)}
              </ul>
            </details>
          </>
        ) : (
          <p className="empty-state">Registre o peso da Fedora na aba Peso pra ver o comparativo com o ideal.</p>
        )}
      </div>

      {cocosAnormais.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--remedios-soft)', background: 'var(--remedios-soft)' }}>
          <p className="card-title" style={{ color: 'var(--danger)' }}>⚠ Cocô fora do normal nesse dia</p>
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
          <p className="card-title"><NotebookPen size={15} style={{ marginRight: 6 }} />Notas desse dia</p>
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
