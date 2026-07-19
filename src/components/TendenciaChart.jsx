import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts';

export default function TendenciaChart({ dados, cor, faixaIdeal, tipo = 'bar', dataKey = 'valor' }) {
  if (!dados || dados.length === 0) {
    return <p className="empty-state">Sem dados suficientes para o gráfico ainda.</p>;
  }

  const Chart = tipo === 'linha' ? LineChart : BarChart;

  return (
    <div style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={dados} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'var(--ink-soft)' }} stroke="var(--border)" />
          <YAxis tick={{ fontSize: 10, fill: 'var(--ink-soft)' }} stroke="var(--border)" />
          <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
          {faixaIdeal && (
            <ReferenceArea y1={faixaIdeal.min} y2={faixaIdeal.max} fill="var(--ok)" fillOpacity={0.12} />
          )}
          {tipo === 'linha' ? (
            <Line type="monotone" dataKey={dataKey} stroke={cor} strokeWidth={2} dot={{ r: 3 }} />
          ) : (
            <Bar dataKey={dataKey} fill={cor} radius={[4, 4, 0, 0]} />
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
