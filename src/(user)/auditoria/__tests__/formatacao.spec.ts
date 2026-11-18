import { describe, expect, it } from 'vitest'
import { diferencasEntreVersoes, valorCorrecao } from '../formatacao'
import { regraBlackFriday } from '../../chat/__tests__/fakes'

describe('comparação de versões', () => {
  it('destaca somente parâmetros alterados, com valores formatados', () => {
    const diff = diferencasEntreVersoes(regraBlackFriday(), regraBlackFriday({ pct_acrescimo: 2 }))
    expect(diff).toHaveLength(1)
    expect(diff[0]).toMatchObject({ chave: 'pct_acrescimo', antes: '1%', depois: '2%' })
  })
  it('inclui parâmetros adicionados e removidos', () => {
    const a = regraBlackFriday(),
      b = regraBlackFriday()
    a.parametros = a.parametros.filter((p) => p.key !== 'meta_vendas')
    b.parametros = b.parametros.filter((p) => p.key !== 'orcamento_limite')
    const diff = diferencasEntreVersoes(a, b)
    expect(diff.find((d) => d.chave === 'meta_vendas')?.antes).toBe('Não informado')
    expect(diff.find((d) => d.chave === 'orcamento_limite')?.depois).toBe('Removido')
  })
  it('não confunde reordenação de seleção com mudança de regra', () => {
    expect(
      diferencasEntreVersoes(
        regraBlackFriday(),
        regraBlackFriday({ cargos_alvo: ['300', '100', '200'] }),
      ),
    ).toEqual([])
  })
  it('formata antes/depois escalar, nulo e objeto de RH', () => {
    expect(valorCorrecao(null)).toBe('Não informado')
    expect(valorCorrecao('8')).toBe('8')
    expect(valorCorrecao({ data_inicio: '2026-11-13', cod_loja: '8' })).toBe(
      'Início: 13/11/2026 · Loja: 8',
    )
  })
})
