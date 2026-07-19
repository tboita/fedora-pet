// Referências gerais baseadas em fontes veterinárias (Royal Canin Portal Vet,
// hospitais veterinários e nutricionistas felinos). São estimativas médias
// para gatos adultos saudáveis — não substituem orientação veterinária
// individualizada, especialmente em caso de doenças renais, diabetes ou
// outras condições.

// Água: ~45-60 ml por kg de peso corporal por dia (fonte: Royal Canin Portal Vet)
export function faixaAguaIdeal(pesoKg) {
  if (!pesoKg) return null;
  return { min: Math.round(pesoKg * 45), max: Math.round(pesoKg * 60) };
}

// Ração seca: ~11-16 g por kg de peso corporal por dia para gatos adultos
// (baseado em faixas de mercado: gatos de 3-4kg comem 40-55g, 5-6kg comem 55-75g)
export function faixaRacaoSecaIdeal(pesoKg) {
  if (!pesoKg) return null;
  return { min: Math.round(pesoKg * 11), max: Math.round(pesoKg * 16) };
}

// Xixi: geralmente 2 a 5 vezes por dia (não é proporcional ao peso)
export const faixaXixiIdeal = { min: 2, max: 5 };

// Cocô: geralmente 1 a 2 vezes por dia (não é proporcional ao peso)
export const faixaCocoIdeal = { min: 1, max: 2 };

// Classifica um valor real dentro de uma faixa ideal
export function statusFaixa(valor, faixa) {
  if (!faixa || valor == null) return 'sem-dados';
  if (valor < faixa.min) return 'abaixo';
  if (valor > faixa.max) return 'acima';
  return 'dentro';
}
