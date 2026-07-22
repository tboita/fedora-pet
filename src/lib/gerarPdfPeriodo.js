import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabaseClient';
import { chaveDia, diasAtras, formatarDataCurta, formatarData } from './frequencia';

async function buscarDadosPeriodo(dias) {
  const inicio = diasAtras(dias - 1).toISOString();

  const [alimentacao, agua, necessidades, peso] = await Promise.all([
    supabase.from('alimentacao').select('*').gte('registrado_em', inicio).not('quantidade_restante', 'is', null),
    supabase.from('agua').select('*').gte('registrado_em', inicio).not('quantidade_restante', 'is', null),
    supabase.from('necessidades').select('*').gte('registrado_em', inicio),
    supabase.from('peso').select('*').gte('registrado_em', inicio).order('registrado_em', { ascending: true }),
  ]);

  const porDia = {};
  for (let i = dias - 1; i >= 0; i--) {
    const d = diasAtras(i);
    porDia[chaveDia(d)] = {
      data: d,
      seca: 0,
      umida: 0,
      agua: 0,
      xixi: 0,
      coco: 0,
      peso: null,
    };
  }

  (alimentacao.data || []).forEach(r => {
    const chave = chaveDia(r.registrado_em);
    if (!porDia[chave]) return;
    const consumido = Number(r.quantidade_colocada) - Number(r.quantidade_restante);
    if ((r.tipo || 'seca') === 'seca') porDia[chave].seca += consumido;
    else porDia[chave].umida += consumido;
  });

  (agua.data || []).forEach(r => {
    const chave = chaveDia(r.registrado_em);
    if (!porDia[chave]) return;
    porDia[chave].agua += Number(r.quantidade_colocada) - Number(r.quantidade_restante);
  });

  (necessidades.data || []).forEach(r => {
    const chave = chaveDia(r.registrado_em);
    if (!porDia[chave]) return;
    if (r.tipo === 'xixi') porDia[chave].xixi += 1;
    else if (r.tipo === 'coco') porDia[chave].coco += 1;
  });

  (peso.data || []).forEach(r => {
    const chave = chaveDia(r.registrado_em);
    if (porDia[chave]) porDia[chave].peso = r.peso_kg;
  });

  return Object.values(porDia);
}

function montarPdfTabela(titulo, linhasPorDia, dias) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 34, 51);
  doc.text('Relatório - Fedora', 14, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 145, 168);
  doc.text(`${titulo} — ${formatarData(diasAtras(dias - 1))} a ${formatarData(new Date())}`, 14, 27);

  const corpo = linhasPorDia.map(d => [
    formatarDataCurta(d.data),
    d.seca ? `${Math.round(d.seca)}g` : '-',
    d.umida ? `${Math.round(d.umida)}g` : '-',
    d.agua ? `${Math.round(d.agua)}ml` : '-',
    d.xixi || '0',
    d.coco || '0',
    d.peso ? `${d.peso}kg` : '-',
  ]);

  const totalSeca = linhasPorDia.reduce((s, d) => s + d.seca, 0);
  const totalUmida = linhasPorDia.reduce((s, d) => s + d.umida, 0);
  const totalAgua = linhasPorDia.reduce((s, d) => s + d.agua, 0);
  const totalXixi = linhasPorDia.reduce((s, d) => s + d.xixi, 0);
  const totalCoco = linhasPorDia.reduce((s, d) => s + d.coco, 0);
  const diasComDados = linhasPorDia.filter(d => d.seca || d.umida || d.agua || d.xixi || d.coco).length || 1;

  autoTable(doc, {
    startY: 34,
    head: [['Data', 'Ração seca', 'Ração úmida', 'Água', 'Xixi', 'Cocô', 'Peso']],
    body: corpo,
    foot: [[
      'Média/dia',
      `${Math.round(totalSeca / diasComDados)}g`,
      `${Math.round(totalUmida / diasComDados)}g`,
      `${Math.round(totalAgua / diasComDados)}ml`,
      (totalXixi / diasComDados).toFixed(1),
      (totalCoco / diasComDados).toFixed(1),
      '',
    ]],
    theme: 'striped',
    headStyles: { fillColor: [91, 95, 239], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 250], textColor: [30, 34, 51], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  return doc;
}

export async function gerarRelatorioSemanal() {
  const dados = await buscarDadosPeriodo(7);
  const doc = montarPdfTabela('Últimos 7 dias', dados, 7);
  doc.save(`fedora-relatorio-semanal-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function gerarRelatorioMensal() {
  const dados = await buscarDadosPeriodo(30);
  const doc = montarPdfTabela('Últimos 30 dias', dados, 30);
  doc.save(`fedora-relatorio-mensal-${new Date().toISOString().slice(0, 10)}.pdf`);
}
