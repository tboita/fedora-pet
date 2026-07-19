import { AlertTriangle } from 'lucide-react';
import { horasDesde, formatarHora } from '../lib/frequencia';

// Regra de segurança do resumo clínico da Fedora: limite de 10h (tutor) /
// 12h máximo (equipe) sem comer — passou de 12h, voltar à clínica.
// A prioridade atual do time veterinário é que ela coma, não uma meta de
// dieta — por isso esse alerta vem antes de qualquer comparativo de gramas.
export default function AlertaJejum({ ultimaAlimentacao }) {
  if (!ultimaAlimentacao) return null;

  const horas = horasDesde(ultimaAlimentacao.registrado_em);
  if (horas < 8) return null;

  const critico = horas >= 12;
  const alerta = horas >= 10;

  const cor = critico ? 'var(--danger)' : alerta ? 'var(--danger)' : 'var(--warn)';
  const fundo = critico || alerta ? 'var(--remedios-soft)' : 'rgba(255, 217, 102, 0.16)';

  return (
    <div className="card" style={{ background: fundo, borderColor: cor }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AlertTriangle size={20} color={cor} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: cor }}>
            {critico
              ? `Passou de 12h sem comer (${horas.toFixed(1)}h) — voltar à clínica`
              : alerta
              ? `${horas.toFixed(1)}h sem comer — limite do tutor é 10h`
              : `${horas.toFixed(1)}h sem comer — de olho, limite é 10-12h`}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-soft)' }}>
            Última porção registrada às {formatarHora(ultimaAlimentacao.registrado_em)}
          </p>
        </div>
      </div>
    </div>
  );
}
