import type { ParametroRegra, Periodo } from './types'

// Campanha futura calculada sobre um mês histórico (ADR-006): o período diz quando a campanha
// vale; a competência de referência, qual mês da base entra no cálculo. A Lana já devolve a
// ficha com a sugestão (regra_tool/referencia.py); aqui só repetimos a mesma conta para quando
// o usuário troca o período no painel, sem passar pela conversa.

export const CHAVE_REFERENCIA = 'competencia_referencia'
export const CHAVE_CRESCIMENTO = 'pct_crescimento'
export const CHAVES_REFERENCIA: readonly string[] = [CHAVE_REFERENCIA, CHAVE_CRESCIMENTO]

/** "YYYY-MM-DD" de hoje no fuso local (toISOString usaria UTC e viraria o dia depois das 21h). */
export function hojeIso(data: Date = new Date()): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

/**
 * O período ainda não terminou, então a base não tem o histórico dele.
 * Ex.: periodoFuturo({ data_inicio: '2026-11-24', data_fim: '2026-11-30' }, '2026-11-20') -> true
 */
export function periodoFuturo(periodo: Periodo | null | undefined, hoje: string = hojeIso()): boolean {
  return !!periodo?.data_inicio && !!periodo.data_fim && periodo.data_fim >= hoje
}

/** O mesmo mês do ano anterior. Ex.: sugerirReferencia({ data_inicio: '2026-11-24', ... }) -> '2025-11' */
export function sugerirReferencia(periodo: Periodo): string | null {
  const [ano, mes] = (periodo.data_inicio ?? '').split('-')
  return ano && mes ? `${Number(ano) - 1}-${mes}` : null
}

/**
 * Valores de referência e crescimento depois que o período mudou de `anterior` para `atual`.
 * Futuro: a referência ainda vazia, ou a que era a sugestão do período anterior, vira a nova
 * sugestão (a escolhida pelo usuário fica); crescimento vazio vira 0%. Histórico: os dois saem.
 *
 * Ex.: referenciaParaOPeriodo(nov2025, nov2026, { competencia_referencia: null, pct_crescimento: null })
 *      -> { competencia_referencia: '2025-11', pct_crescimento: 0 }
 */
export function referenciaParaOPeriodo(
  anterior: Periodo | null,
  atual: Periodo,
  valores: { referencia: string | null; crescimento: number | null },
  hoje: string = hojeIso(),
): { referencia: string | null; crescimento: number | null } {
  if (!periodoFuturo(atual, hoje)) return { referencia: null, crescimento: null }
  const sugestaoAnterior = anterior ? sugerirReferencia(anterior) : null
  const manter = valores.referencia && valores.referencia !== sugestaoAnterior
  return {
    referencia: manter ? valores.referencia : sugerirReferencia(atual),
    crescimento: valores.crescimento ?? 0,
  }
}

/** Os campos de referência só aparecem na ficha quando o período é futuro. */
export function parametroVisivel(
  parametro: ParametroRegra,
  periodo: Periodo | null | undefined,
  hoje: string = hojeIso(),
): boolean {
  return !CHAVES_REFERENCIA.includes(parametro.key) || periodoFuturo(periodo, hoje)
}
