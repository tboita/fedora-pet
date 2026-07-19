import { jsPDF } from 'jspdf';
import { formatarData, formatarHora, rotuloFrequencia } from './frequencia';

export function gerarRelatorioPDF(dados) {
  const doc = new jsPDF();
  const dataRelatorio = dados.dataRelatorio || new Date();
  const dataFormatada = formatarData(dataRelatorio);
  let y = 20;

  function linha(texto, tamanho = 11, negrito = false, cor = [30, 34, 51]) {
    doc.setFontSize(tamanho);
    doc.setFont('helvetica', negrito ? 'bold' : 'normal');
    doc.setTextColor(...cor);
    doc.text(texto, 14, y);
    y += tamanho === 11 ? 7 : 9;
  }

  function espaco(n = 4) { y += n; }

  linha('Relatório diário - Fedora', 18, true);
  linha(dataFormatada, 11, false, [140, 145, 168]);
  espaco(4);

  linha('Alimentação', 13, true);
  linha(`Ração seca comida: ${dados.totalSecaConsumida}g   ·   Ração úmida comida: ${dados.totalUmidaConsumida}g`);
  if (dados.alimentacao.length === 0) linha('Nenhum registro hoje.');
  dados.alimentacao.forEach(r => {
    const tipoLabel = r.tipo === 'umida' ? 'úmida' : 'seca';
    const status = r.quantidade_restante != null
      ? `comeu ${(r.quantidade_colocada - r.quantidade_restante).toFixed(0)}g`
      : 'aguardando sobra';
    const obs = r.observacoes ? ` [${r.observacoes}]` : '';
    linha(`${formatarHora(r.registrado_em)} - ${r.quantidade_colocada}g (${tipoLabel}) colocados (${status})${obs}`, 10);
  });
  espaco(4);

  linha('Água', 13, true);
  linha(`Total colocado: ${dados.totalAgua}ml   ·   Total bebido: ${dados.totalAguaConsumida}ml`);
  if (dados.agua.length === 0) linha('Nenhum registro hoje.');
  dados.agua.forEach(r => {
    const status = r.quantidade_restante != null
      ? `bebeu ${(r.quantidade_colocada - r.quantidade_restante).toFixed(0)}ml`
      : 'aguardando sobra';
    const obs = r.observacoes ? ` [${r.observacoes}]` : '';
    linha(`${formatarHora(r.registrado_em)} - ${r.quantidade_colocada}ml colocados (${status})${obs}`, 10);
  });
  espaco(4);

  linha('Xixi / Cocô', 13, true);
  const xixis = dados.necessidades.filter(n => n.tipo === 'xixi').length;
  const cocos = dados.necessidades.filter(n => n.tipo === 'coco').length;
  linha(`Xixi: ${xixis}   ·   Cocô: ${cocos}`);
  dados.necessidades.forEach(n => {
    linha(`${formatarHora(n.registrado_em)} - ${n.tipo === 'xixi' ? 'Xixi' : 'Cocô'}${n.consistencia ? ' - ' + n.consistencia : ''}`, 10);
  });
  espaco(4);

  linha('Medicação', 13, true);
  if (dados.medicamentos.length === 0) linha('Nenhum medicamento cadastrado.');
  dados.medicamentos.forEach(m => {
    linha(`${m.nome} (${rotuloFrequencia[m.frequencia]})${m.dose ? ' - ' + m.dose : ''}`, 10);
  });
  espaco(4);

  linha('Peso', 13, true);
  linha(dados.peso ? `${dados.peso.peso_kg}kg (último registro em ${formatarData(dados.peso.registrado_em)})` : 'Sem registro.');
  espaco(4);

  linha('Comportamento', 13, true);
  if (dados.comportamento.length === 0) linha('Nenhuma nota hoje.');
  dados.comportamento.forEach(c => {
    linha(`${formatarHora(c.registrado_em)} - ${c.observacoes}`, 10);
  });

  doc.save(`fedora-relatorio-${dataRelatorio.toISOString().slice(0, 10)}.pdf`);
}
