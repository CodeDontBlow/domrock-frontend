import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CampoPercentual from '../components/campos/CampoPercentual.vue'
import ParametrosPanel from '../components/ParametrosPanel.vue'
import {
  hojeIso,
  parametroVisivel,
  periodoFuturo,
  referenciaParaOPeriodo,
  sugerirReferencia,
} from '../referencia'
import { definirServicoCampanha, useChatStore } from '../stores/chat'
import type { Periodo, RegraCampanha } from '../types'
import { FakeServicoCampanha, regraBlackFriday } from './fakes'

// ADR-006: campanha futura calculada sobre um mês histórico de referência.
const HOJE = '2026-11-20'
const BF_2025: Periodo = { data_inicio: '2025-11-24', data_fim: '2025-11-30' }
const BF_2026: Periodo = { data_inicio: '2026-11-24', data_fim: '2026-11-30' }
// Nos testes que usam a data de hoje de verdade, um ano distante mantém o período futuro.
const BF_2099: Periodo = { data_inicio: '2099-11-24', data_fim: '2099-11-30' }
const NATAL_2099: Periodo = { data_inicio: '2099-12-01', data_fim: '2099-12-24' }

/** A ficha como a Lana devolve agora: com os dois campos opcionais da referência. */
function regraComReferencia(
  periodo: Periodo,
  referencia: string | null = null,
  crescimento: number | null = null,
): RegraCampanha {
  const regra = regraBlackFriday({ periodo })
  regra.parametros.push(
    {
      key: 'competencia_referencia',
      label: 'Mês de Referência',
      type: 'month',
      categoria: 'REGRA',
      value: referencia,
      options: null,
      required: false,
    },
    {
      key: 'pct_crescimento',
      label: 'Crescimento sobre a Referência (%)',
      type: 'percentage',
      categoria: 'REGRA',
      value: crescimento,
      options: null,
      required: false,
    },
  )
  return regra
}

function valor(regra: RegraCampanha | null, key: string): unknown {
  return regra?.parametros.find((p) => p.key === key)?.value
}

describe('referência da campanha futura', () => {
  it('período futuro é o que ainda não terminou', () => {
    expect(periodoFuturo(BF_2026, HOJE)).toBe(true)
    expect(periodoFuturo(BF_2025, HOJE)).toBe(false)
    expect(periodoFuturo({ data_inicio: '2026-11-24', data_fim: null }, HOJE)).toBe(false)
  })

  it('sugere o mesmo mês do ano anterior', () => {
    expect(sugerirReferencia(BF_2026)).toBe('2025-11')
  })

  it('período futuro sem referência recebe a sugestão e 0% de crescimento', () => {
    const vazios = { referencia: null, crescimento: null }

    expect(referenciaParaOPeriodo(BF_2025, BF_2026, vazios, HOJE)).toEqual({
      referencia: '2025-11',
      crescimento: 0,
    })
  })

  it('troca a sugestão antiga pela do novo período, mas mantém a escolha do usuário', () => {
    const natal: Periodo = { data_inicio: '2026-12-01', data_fim: '2026-12-24' }

    expect(
      referenciaParaOPeriodo(BF_2026, natal, { referencia: '2025-11', crescimento: 10 }, HOJE),
    ).toEqual({ referencia: '2025-12', crescimento: 10 })
    expect(
      referenciaParaOPeriodo(BF_2026, natal, { referencia: '2025-10', crescimento: 10 }, HOJE),
    ).toEqual({ referencia: '2025-10', crescimento: 10 })
  })

  it('período histórico tira referência e crescimento', () => {
    expect(
      referenciaParaOPeriodo(BF_2026, BF_2025, { referencia: '2025-11', crescimento: 10 }, HOJE),
    ).toEqual({ referencia: null, crescimento: null })
  })

  it('os campos de referência só ficam visíveis no período futuro', () => {
    const [referencia] = regraComReferencia(BF_2026).parametros.slice(-2)
    const meta = regraBlackFriday().parametros.find((p) => p.key === 'meta_vendas')!

    expect(parametroVisivel(referencia!, BF_2026, HOJE)).toBe(true)
    expect(parametroVisivel(referencia!, BF_2025, HOJE)).toBe(false)
    expect(parametroVisivel(meta, BF_2025, HOJE)).toBe(true)
  })

  it('hoje vai no fuso local', () => {
    expect(hojeIso(new Date(2026, 10, 20, 23, 30))).toBe('2026-11-20')
  })
})

describe('ficha com campanha futura', () => {
  function rotulos(regra: RegraCampanha): string[] {
    const wrapper = mount(ParametrosPanel, {
      props: { regra, camposVazios: [], podeSimular: true, simulando: false, ocupado: false },
    })
    return wrapper.findAll('.campo-rotulo').map((r) => r.text())
  }

  it('mostra mês de referência e % de crescimento só com o período futuro', () => {
    expect(rotulos(regraComReferencia(BF_2099, '2098-11', 0))).toEqual(
      expect.arrayContaining(['Mês de referência', '% de crescimento']),
    )
    expect(rotulos(regraComReferencia(BF_2025))).not.toContain('Mês de referência')
    expect(rotulos(regraComReferencia(BF_2025))).not.toContain('% de crescimento')
  })

  it('o crescimento aceita 0%, o acréscimo continua começando em 0,01', async () => {
    const base = { faltando: false, idCampo: 'x', rotulo: 'Campo' }
    const crescimento = mount(CampoPercentual, { props: { ...base, modelValue: 0.05, minimo: 0 } })
    const acrescimo = mount(CampoPercentual, { props: { ...base, modelValue: 0.05 } })

    await crescimento.findAll('button')[0]?.trigger('click')
    await acrescimo.findAll('button')[0]?.trigger('click')

    expect(crescimento.emitted('update:modelValue')?.[0]).toEqual([0])
    expect(acrescimo.emitted('update:modelValue')?.[0]).toEqual([0.01])
  })
})

describe('painel ao trocar o período', () => {
  let servico: FakeServicoCampanha

  beforeEach(() => {
    setActivePinia(createPinia())
    servico = new FakeServicoCampanha()
    servico.respostaChat = { chat_id: 'c', response: 'Anotado!', regra: regraComReferencia(BF_2025) }
    definirServicoCampanha(servico)
  })

  it('período futuro preenche a sugestão e 0%; o usuário pode trocar a referência', async () => {
    const chat = useChatStore()
    await chat.enviar('Black Friday')

    chat.atualizarParametro('periodo', BF_2099)
    expect(valor(chat.regra, 'competencia_referencia')).toBe('2098-11')
    expect(valor(chat.regra, 'pct_crescimento')).toBe(0)

    chat.atualizarParametro('competencia_referencia', '2098-10')
    chat.atualizarParametro('pct_crescimento', 10)
    chat.atualizarParametro('periodo', NATAL_2099)
    expect(valor(chat.regra, 'competencia_referencia')).toBe('2098-10')
    expect(valor(chat.regra, 'pct_crescimento')).toBe(10)
  })

  it('voltar para um período histórico tira referência e crescimento da ficha', async () => {
    const chat = useChatStore()
    await chat.enviar('Black Friday')
    chat.atualizarParametro('periodo', BF_2099)

    chat.atualizarParametro('periodo', BF_2025)

    expect(valor(chat.regra, 'competencia_referencia')).toBeNull()
    expect(valor(chat.regra, 'pct_crescimento')).toBeNull()
  })

  it('ficha antiga, sem os campos de referência, continua igual', async () => {
    servico.respostaChat = { chat_id: 'c', response: 'Anotado!', regra: regraBlackFriday() }
    const chat = useChatStore()
    await chat.enviar('Black Friday')

    chat.atualizarParametro('periodo', BF_2099)

    expect(valor(chat.regra, 'periodo')).toEqual(BF_2099)
    expect(chat.regra?.parametros).toHaveLength(6)
  })
})
