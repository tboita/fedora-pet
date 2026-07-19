function corStatus(status) {
  if (status === 'abaixo') return 'var(--agua)';
  if (status === 'acima') return 'var(--danger)';
  if (status === 'dentro') return 'var(--ok)';
  return 'var(--ink-soft)';
}

function textoStatus(status) {
  if (status === 'abaixo') return 'Abaixo do ideal';
  if (status === 'acima') return 'Acima do ideal';
  if (status === 'dentro') return 'Dentro do ideal';
  return 'Sem peso registrado';
}

export default function ComparativoIdeal({ titulo, valorReal, unidade, faixa, status }) {
  const maxVisual = faixa ? (faixa.semTeto ? faixa.min * 1.6 : faixa.max) : 0;
  const percentual = faixa ? Math.min(100, Math.round((valorReal / maxVisual) * 100)) : 0;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{titulo}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: corStatus(status) }}>{textoStatus(status)}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percentual}%`, background: corStatus(status) }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
        {valorReal}{unidade} de {faixa
          ? (faixa.semTeto ? `mín. ${faixa.min}${unidade} ideal` : `${faixa.min}–${faixa.max}${unidade} ideal`)
          : 'faixa indisponível'}
      </div>
    </div>
  );
}
