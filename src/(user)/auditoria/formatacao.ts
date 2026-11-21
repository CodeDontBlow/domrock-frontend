import { isAxiosError } from 'axios'
import { valorDoParametro, diaDaCampanha } from '../campanhas/formatacao'
import type { RegraCampanha, ValorParametro } from '../chat/types'

function compararValor(valor: ValorParametro | undefined): string {
  if (Array.isArray(valor)) return JSON.stringify([...valor].sort())
  if (valor && typeof valor === 'object') return JSON.stringify([valor.data_inicio, valor.data_fim])
  return JSON.stringify(valor) ?? ''
}

/** Compara por chave, incluindo parâmetros adicionados e removidos, sem recalcular valores. */
export function diferencasEntreVersoes(antes: RegraCampanha, depois: RegraCampanha) {
  const antigos = new Map(antes.parametros.map((p) => [p.key, p]))
  const novos = new Map(depois.parametros.map((p) => [p.key, p]))
  return [...new Set([...antigos.keys(), ...novos.keys()])].flatMap((key) => {
    const a = antigos.get(key)
    const b = novos.get(key)
    if (a && b && compararValor(a.value) === compararValor(b.value)) return []
    return [
      {
        chave: key,
        rotulo: b?.label ?? a?.label ?? key,
        antes: a ? valorDoParametro(a) : 'Não informado',
        depois: b ? valorDoParametro(b) : 'Removido',
      },
    ]
  })
}

const rotulos: Record<string, string> = {
  TRANSFERENCIA_LOJA: 'Transferência de loja',
  TROCA_CARGO: 'Troca de cargo',
  DATA_ADMISSAO: 'Data de admissão',
  DATA_DEMISSAO: 'Data de demissão',
  AFASTAMENTO: 'Afastamento',
  FERIAS: 'Férias',
  LICENCA_MATERNIDADE: 'Licença-maternidade',
  COBERTURA_LOJA: 'Cobertura de loja',
  DEMISSAO: 'Demissão',
  data_inicio: 'Início',
  data_fim: 'Fim',
  cod_loja: 'Loja',
}
export function rotuloCorrecao(tipo: string): string {
  return rotulos[tipo] ?? tipo
}

export function valorCorrecao(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return 'Não informado'
  if (Array.isArray(valor)) return valor.map(valorCorrecao).join(', ')
  if (typeof valor === 'object')
    return Object.entries(valor)
      .map(([k, v]) => `${rotuloCorrecao(k)}: ${valorCorrecao(v)}`)
      .join(' · ')
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return diaDaCampanha(valor)
  return String(valor)
}

export function erroConsulta(erro: unknown, assunto: string): string {
  if (isAxiosError(erro) && erro.response?.status === 403)
    return 'Seu perfil não permite esta consulta.'
  return `Não foi possível carregar ${assunto}. Tente novamente.`
}
