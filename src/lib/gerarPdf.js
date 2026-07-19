import { jsPDF } from 'jspdf';
import { formatarData, formatarHora, rotuloFrequencia } from './frequencia';
import { faixaAguaIdeal, faixaRacaoSecaIdeal, faixaXixiIdeal, faixaCocoIdeal, statusFaixa, FONTES_CIENTIFICAS } from './referencias';

const MARGEM_ESQUERDA = 14;
const LARGURA_MAX = 182; // largura útil da página A4 (210mm - margens)
const LIMITE_INFERIOR = 280; // ponto seguro antes do fim da página A4 (297mm)

export function gerarRelatorioPDF(dados) {
  const doc = new jsPDF();
  const dataRelatorio = dados.dataRelatorio || new Date();
  const dataFormatada = formatarData(dataRelatorio);
  let y = 20;

  function quebrarPaginaSeNecessario(alturaNecessaria) {
    if (y + alturaNecessaria > LIMITE_INFERIOR) {
      doc.addPage();
      y = 20;
    }
  }

  function linha(texto, tamanho = 11, negrito = false, cor = [30, 34, 51]) {
    doc.setFontSize(tamanho);
    doc.setFont('helvetica', negrito ? 'bold' : 'normal');
    doc.setTextColor(...cor);

    const alturaLinha = tamanho === 11 ? 7 : 9;
    const linhasQuebradas = doc.splitTextToSize(texto, LARGURA_MAX);

    linhasQuebradas.forEach(parte => {
      quebrarPaginaSeNecessario(alturaLinha);
      doc.text(parte, MARGEM_ESQUERDA, y);
      y += alturaLinha;
    });
  }

  function espaco(n = 4) {
    quebrarPaginaSeNecessario(n);
    y += n;
  }

  linha('Relatório diário - Fedora', 18, true);
  linha(dataFormatada, 11, false, [140, 145, 168]);
  espaco(4);

  linha('Alimentação', 13, true);
  linha(`Ração seca comida: ${dados.totalSecaConsumida}g   ·   Ração úmida comida: ${dados.totalUmidaConsumida}g`);
  if (dados.alimentacao.length === 0) linha('Nenhum registro nesse dia.');
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
  if (dados.agua.length === 0) linha('Nenhum registro nesse dia.');
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
  if (dados.comportamento.length === 0) linha('Nenhuma nota nesse dia.');
  dados.comportamento.forEach(c => {
    linha(`${formatarHora(c.registrado_em)} - ${c.observacoes}`, 10);
  });
  espaco(4);

  const xixisIdeal = dados.necessidades.filter(n => n.tipo === 'xixi').length;
  const cocosIdeal = dados.necessidades.filter(n => n.tipo === 'coco').length;

  linha('Consumo x ideal (considerando a DCR da Fedora)', 13, true);
  if (dados.peso) {
    const pesoKg = dados.peso.peso_kg;
    const fAgua = faixaAguaIdeal(pesoKg);
    const fRacao = faixaRacaoSecaIdeal(pesoKg);
    linha(`Ração seca: ${dados.totalSecaConsumida}g (ideal ${fRacao.min}-${fRacao.max}g) - ${statusFaixa(dados.totalSecaConsumida, fRacao)}`, 10);
    linha(`Água: ${dados.totalAguaConsumida}ml (piso ideal ${fAgua.min}ml, sem teto) - ${statusFaixa(dados.totalAguaConsumida, fAgua)}`, 10);
    linha(`Xixi: ${xixisIdeal}x (ideal ${faixaXixiIdeal.min}-${faixaXixiIdeal.max}x) - ${statusFaixa(xixisIdeal, faixaXixiIdeal)}`, 10);
    linha(`Cocô: ${cocosIdeal}x (ideal ${faixaCocoIdeal.min}-${faixaCocoIdeal.max}x) - ${statusFaixa(cocosIdeal, faixaCocoIdeal)}`, 10);
  } else {
    linha('Sem peso registrado para calcular o comparativo.', 10);
  }
  linha('Água tratada como piso mínimo (mais é protetor em DCR, não excesso). A Sênior 12+ não é dieta renal terapêutica.', 9, false, [140, 145, 168]);
  espaco(4);

  linha('Fontes científicas (revisadas por pares)', 13, true);
  FONTES_CIENTIFICAS.forEach(fonte => linha(fonte, 9, false, [140, 145, 168]));

  doc.save(`fedora-relatorio-${dataRelatorio.toISOString().slice(0, 10)}.pdf`);
}
