import type { ApuracaoPessoa } from './types'

/** Soma os valores finais recebidos em centavos; não reaplica regras de comissão. */
export function somarApuracao(linhas: readonly ApuracaoPessoa[]): number {
  return (
    linhas.reduce((total, linha) => total + Math.round(linha.comissao_com_campanha * 100), 0) / 100
  )
}

/** Comparação na precisão monetária exibida pela tela. */
export function totalDaApuracaoConfere(soma: number, totalSimulado: number): boolean {
  return Math.round(soma * 100) === Math.round(totalSimulado * 100)
}

/** Preserva a explicação da Lana e identifica a regra mesmo se não estiver no texto. */
export function rotuloAjuste(ajuste: ApuracaoPessoa['detalhamento'][number]): string {
  return ajuste.descricao.startsWith(ajuste.regra)
    ? ajuste.descricao
    : `${ajuste.regra} — ${ajuste.descricao}`
}
