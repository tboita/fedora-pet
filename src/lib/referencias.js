// Referências para a Fedora — gata idosa (15 anos, SRD, ~3,7-3,8kg) com DRC
// bilateral avançada (rim direito atrofiado, rim esquerdo com infartos
// crônicos, densidade urinária 1.008), anemia associada à DRC, osteoartrose
// no cotovelo direito, acompanhada pelo Hospital Afeto Felino (Curitiba).
// Bioquímica de 07/07: creatinina 2,1 | ureia 58 | UPC 0,31 (proteinúria
// borderline, a monitorar). Alimentada com Royal Canin Sênior 12+.
//
// ESTADIAMENTO IRIS: estágio 2, evoluindo para 3 (segundo o tutor; exames
// mais recentes ainda pendentes). Pela tabela IRIS, creatinina de 2,1 mg/dL
// fica na faixa alta do estágio 2 (1,6-2,8) — a proximidade do estágio 3
// (2,9-5,0) é coerente com a evolução relatada. Segundo as diretrizes de
// consenso (Sparkes et al., 2016), no estágio 2 uma dieta renal já deve ser
// considerada, e no estágio 3 passa a ser recomendada — vale retomar essa
// conversa com a equipe quando os novos exames saírem.
//
// IMPORTANTE (orientação da equipe médica, retorno mais recente): agora não
// é hora de dieta restritiva — a prioridade é que ela coma, com limite de
// 10h (tutor) / 12h (equipe) sem alimentação antes de retornar à clínica.
// As metas de gramas abaixo são referência geral, não uma meta a perseguir
// enquanto o apetite estiver instável.

export const CONTEXTO_CLINICO = {
  estagioIris: '2 → 3 (em evolução, exames mais recentes pendentes)',
  ultimaCreatinina: '2,1 mg/dL (07/07)',
  ultimaUreia: '58 mg/dL (07/07)',
  upc: '0,31 — proteinúria borderline (07/07)',
  nota: 'A equipe médica orientou que agora não é hora de dieta restritiva — prioridade é ela comer.',
};
//
// Fontes revisadas por pares:
// 1. Ross SJ, Osborne CA, Kirk CA, et al. (2006). Clinical evaluation of
//    dietary modification for treatment of spontaneous chronic kidney
//    disease in cats. JAVMA, 229(6):949-957.
// 2. Elliott J, Rawlings JM, Markwell PJ, Barber PJ (2000). Survival of cats
//    with naturally occurring chronic renal failure: effect of dietary
//    management. Journal of Small Animal Practice, 41(6):235-242.
// 3. Plantinga EA, Everts H, Kastelein AMC, Beynen AC (2005). Retrospective
//    study of the survival of cats with acquired chronic renal
//    insufficiency offered different commercial diets. Veterinary Record,
//    157:185-187.
// 4. JAVMA (2026). Use of a veterinary therapeutic renal diet in cats with
//    early chronic kidney disease is associated with slower disease
//    progression and improved survival. JAVMA, 264(5).
// 5. Sparkes AH, Caney S, Chalhoub S, et al. (2016). ISFM Consensus
//    Guidelines on the Diagnosis and Management of Feline Chronic Kidney
//    Disease. Journal of Feline Medicine and Surgery, 18(3):219-239.
// 6. Van den Broek DHN, et al. (2024). Dietary magnesium supplementation in
//    cats with chronic kidney disease: a prospective double-blind
//    randomized controlled trial. Journal of Veterinary Internal Medicine.
//
// Estas são estimativas gerais da literatura — não substituem orientação
// veterinária individualizada, especialmente com o estadiamento IRIS e
// exames específicos da Fedora.

export const FONTES_CIENTIFICAS = [
  'Ross et al. (2006), JAVMA 229(6):949-957',
  'Elliott et al. (2000), J Small Anim Pract 41(6):235-242',
  'Plantinga et al. (2005), Vet Record 157:185-187',
  'JAVMA (2026) 264(5) — dieta renal e sobrevida',
  'Sparkes et al. (2016), J Feline Med Surg 18(3):219-239 (diretrizes IRIS)',
];

// Água: para gatos com DCR, a hidratação tende a ser um fator PROTETOR — a
// doença reduz a capacidade de concentrar a urina, então esses gatos perdem
// mais água pela urina e se beneficiam de beber MAIS, não menos (Sparkes et
// al. 2016). Por isso tratamos ~50ml/kg/dia como um PISO mínimo, sem teto
// prático — não marcamos "excesso" de água como problema pra ela.
export function faixaAguaIdeal(pesoKg) {
  if (!pesoKg) return null;
  return { min: Math.round(pesoKg * 50), max: Math.round(pesoKg * 120), semTeto: true };
}

// Ração: estimativa geral de manutenção (~11-16g/kg/dia) baseada em faixas
// de mercado para gatos adultos/idosos. Não é uma recomendação de dieta
// renal terapêutica — converse com o veterinário da Fedora sobre isso.
export function faixaRacaoSecaIdeal(pesoKg) {
  if (!pesoKg) return null;
  return { min: Math.round(pesoKg * 11), max: Math.round(pesoKg * 16) };
}

// Xixi: geralmente 2 a 5 vezes por dia. Em gatos com DCR, poliúria (fazer
// xixi mais que o normal) é um sinal esperado da doença, não necessariamente
// um problema agudo — mas vale monitorar mudanças bruscas.
export const faixaXixiIdeal = { min: 2, max: 5, semTeto: true };

// Cocô: geralmente 1 a 2 vezes por dia (não é proporcional ao peso).
export const faixaCocoIdeal = { min: 1, max: 2 };

// Classifica um valor real dentro de uma faixa ideal.
// Quando faixa.semTeto é true, ultrapassar o máximo não é tratado como
// "acima do ideal" (ruim) — continua "dentro", já que mais não é motivo de
// alerta para esses casos específicos da Fedora.
export function statusFaixa(valor, faixa) {
  if (!faixa || valor == null) return 'sem-dados';
  if (valor < faixa.min) return 'abaixo';
  if (valor > faixa.max && !faixa.semTeto) return 'acima';
  return 'dentro';
}
