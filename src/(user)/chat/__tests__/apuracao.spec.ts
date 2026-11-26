import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { somarApuracao, totalDaApuracaoConfere } from '../apuracao'
import ApuracaoPorPessoa from '../components/ApuracaoPorPessoa.vue'
import ResultadoSimulacao from '../components/ResultadoSimulacao.vue'
import { formatarMoeda } from '../formatacao'
import type { ApuracaoPessoa } from '../types'
import { resultadoBlackFriday } from './fakes'

const texto = (valor: string) => valor.replace(/\u00a0/g, ' ')
function pessoa(alteracoes: Partial<ApuracaoPessoa> = {}): ApuracaoPessoa {
  return {
    matricula: 'MATRIC-30',
    competencia: '2025-10',
    cod_loja: '5',
    cod_marca: '10',
    cod_cargo: '100',
    base_calculo: 155000,
    pct_comiss: 2,
    detalhamento: [
      { regra: '5a', descricao: '5a — % da base: 2%' },
      { regra: '5c', descricao: '5c — admissão em 10/10: 21 de 31 dias' },
    ],
    comissao_atual: 2100,
    comissao_com_campanha: 2100,
    ...alteracoes,
  }
}

describe('Apuração por pessoa (A6-109)', () => {
  it('soma valores finais em centavos, incluindo pessoas sem acréscimo e valores zero', () => {
    const linhas = [0.1, 0.2, 1234.56, 0, 3500].map((valor) =>
      pessoa({ comissao_com_campanha: valor }),
    )
    expect(somarApuracao(linhas)).toBe(4734.86)
    expect(totalDaApuracaoConfere(somarApuracao(linhas), 4734.86)).toBe(true)
    expect(totalDaApuracaoConfere(somarApuracao(linhas), 4734.87)).toBe(false)
    expect(somarApuracao([])).toBe(0)
  })

  it.each([
    [1234.56, 'R$ 1.234,56'],
    [3500, 'R$ 3.500,00'],
    [0, 'R$ 0,00'],
    [0.1, 'R$ 0,10'],
  ])('formata %s em reais com duas casas', (valor, esperado) => {
    expect(texto(formatarMoeda(Number(valor)))).toBe(esperado)
  })

  it('mostra as sete colunas, competência e valores do contrato A6-77 sem recalcular regras', () => {
    const wrapper = mount(ApuracaoPorPessoa, { props: { linhas: [pessoa()], totalSimulado: 2100 } })
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual([
      'Matrícula',
      'Cargo',
      'Loja',
      'Base',
      '%',
      'Ajustes',
      'Valor final',
    ])
    const linha = texto(wrapper.get('tbody tr').text())
    expect(linha).toContain('MATRIC-30')
    expect(linha).toContain('Competência 10/2025')
    expect(linha).toContain('Vendedor loja (100)')
    expect(linha).toContain('R$ 155.000,00')
    expect(linha).toContain('2,00%')
    expect(linha).toContain('R$ 2.100,00')
    expect(wrapper.findAll('.ajustes li').map((el) => el.text())).toEqual(
      pessoa().detalhamento.map((a) => a.descricao),
    )
    expect(texto(wrapper.get('tfoot').text())).toContain('R$ 2.100,00')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('mostra todas as regras recebidas, inclusive piso, sem interpretar HTML', () => {
    const detalhamento = [
      { regra: '5b', descricao: 'venda total da loja' },
      { regra: '5d', descricao: 'demissão em 10/11: 10 de 30 dias' },
      { regra: '5e', descricao: 'afastamento: 10 dias remunerados' },
      { regra: '5f', descricao: 'afastamento: máximo de 15 dias' },
      { regra: '5g', descricao: 'férias: 10 dias sem remuneração' },
      { regra: 'piso', descricao: 'recebe o fixo de R$ 3.500,00' },
      { regra: 'nova', descricao: '<img src=x onerror=alert(1)>' },
    ]
    const wrapper = mount(ApuracaoPorPessoa, {
      props: {
        linhas: [pessoa({ cod_cargo: '150', detalhamento, comissao_com_campanha: 3500 })],
        totalSimulado: 3500,
      },
    })
    expect(wrapper.findAll('.ajustes li').map((el) => el.text())).toEqual(
      detalhamento.map((a) => `${a.regra} — ${a.descricao}`),
    )
    expect(wrapper.text()).toContain('Gerente (150)')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('preserva linhas da mesma matrícula em meses diferentes e soma as duas', () => {
    const wrapper = mount(ApuracaoPorPessoa, {
      props: {
        linhas: [pessoa(), pessoa({ competencia: '2025-11', comissao_com_campanha: 300 })],
        totalSimulado: 2400,
      },
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.text()).toContain('11/2025')
    expect(texto(wrapper.get('tfoot').text())).toContain('R$ 2.400,00')
  })

  it('pagina em dez linhas e mantém o total de todas as páginas', async () => {
    const linhas = Array.from({ length: 21 }, (_, i) =>
      pessoa({ matricula: `M${i + 1}`, comissao_com_campanha: 0.1 }),
    )
    const wrapper = mount(ApuracaoPorPessoa, { props: { linhas, totalSimulado: 2.1 } })
    const [anterior, proxima] = wrapper.findAll('nav button')
    expect(anterior!.attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('tbody tr')).toHaveLength(10)
    expect(wrapper.get('nav').text()).toContain('Página 1 de 3')
    await proxima!.trigger('click')
    expect(wrapper.get('tbody th').text()).toContain('M11')
    expect(wrapper.get('nav').text()).toContain('Página 2 de 3')
    await proxima!.trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(proxima!.attributes('disabled')).toBeDefined()
    expect(texto(wrapper.get('tfoot').text())).toContain('R$ 2,10')
    await anterior!.trigger('click')
    expect(wrapper.get('nav').text()).toContain('Página 2 de 3')
  })

  it('combina filtros de loja e cargo, reinicia página e distingue subtotal do total geral', async () => {
    const linhas = Array.from({ length: 12 }, (_, i) =>
      pessoa({ matricula: `M${i}`, comissao_com_campanha: 10 }),
    )
    linhas.push(
      pessoa({ matricula: 'G1', cod_loja: '2', cod_cargo: '150', comissao_com_campanha: 20 }),
    )
    const wrapper = mount(ApuracaoPorPessoa, { props: { linhas, totalSimulado: 140 } })
    await wrapper.findAll('nav button')[1]!.trigger('click')
    const [loja, cargo] = wrapper.findAll('select')
    await loja!.setValue('2')
    expect(wrapper.get('nav').text()).toContain('Página 1 de 1')
    expect(wrapper.get('tbody th').text()).toContain('G1')
    expect(texto(wrapper.get('.subtotal').text())).toContain('R$ 20,00')
    expect(texto(wrapper.get('.total').text())).toContain('R$ 140,00')
    await cargo!.setValue('100')
    expect(wrapper.text()).toContain('Nenhum registro para os filtros selecionados.')
    expect(wrapper.get('nav').text()).toContain('Página 0 de 0')
    expect(
      wrapper.findAll('nav button').every((el) => el.attributes('disabled') !== undefined),
    ).toBe(true)
    await loja!.setValue('')
    expect(wrapper.get('nav').text()).toContain('Página 1 de 2')
    expect(texto(wrapper.get('.subtotal').text())).toContain('R$ 120,00')
    await cargo!.setValue('')
    expect(wrapper.find('.subtotal').exists()).toBe(false)
    expect(wrapper.get('[role="status"]').text()).toBe('13 de 13 registros')
  })

  it('informa divergência sem substituir a soma pelo total informado nem pelo custo adicional', () => {
    const wrapper = mount(ApuracaoPorPessoa, {
      props: { linhas: [pessoa()], totalSimulado: 2100.01 },
    })
    expect(texto(wrapper.get('[role="alert"]').text())).toContain('R$ 2.100,01')
    expect(texto(wrapper.get('tfoot').text())).toContain('R$ 2.100,00')
  })

  it.each([undefined, null])(
    'resultado antigo sem detalhamento (%s) não apresenta total fictício',
    (linhas) => {
      const wrapper = mount(ApuracaoPorPessoa, { props: { linhas, totalSimulado: 123 } })
      expect(wrapper.text()).toContain('não está disponível nesta simulação')
      expect(wrapper.find('table').exists()).toBe(false)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    },
  )

  it('lista vazia informa ausência de pessoas e confere total zero', async () => {
    const wrapper = mount(ApuracaoPorPessoa, { props: { linhas: [], totalSimulado: 0 } })
    expect(wrapper.text()).toContain('Nenhuma pessoa nesta apuração.')
    expect(texto(wrapper.get('tfoot').text())).toContain('R$ 0,00')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    await wrapper.setProps({ totalSimulado: 1 })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('reinicia filtros e página ao receber outro resultado e preserva códigos desconhecidos', async () => {
    const wrapper = mount(ApuracaoPorPessoa, { props: { linhas: [pessoa()], totalSimulado: 2100 } })
    await wrapper.findAll('select')[0]!.setValue('5')
    await wrapper.setProps({
      linhas: [pessoa({ cod_loja: '99', cod_cargo: '999', detalhamento: [] })],
    })
    expect(wrapper.findAll('select').every((el) => el.element.value === '')).toBe(true)
    expect(wrapper.get('tbody').text()).toContain('999')
    expect(wrapper.get('tbody').text()).toContain('Sem ajustes informados')
  })

  it('integra no bloco Comissão usando o total simulado e mantém os blocos anteriores', () => {
    const resultado = resultadoBlackFriday()
    resultado.apuracao_por_pessoa = [pessoa({ comissao_com_campanha: resultado.totais.simulado })]
    const wrapper = mount(ResultadoSimulacao, { props: { resultado } })
    const tabela = wrapper.getComponent(ApuracaoPorPessoa)
    expect(tabela.props('totalSimulado')).toBe(resultado.totais.simulado)
    expect(tabela.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Quanto cada pessoa recebe')
    expect(wrapper.text()).toContain('Onde o custo pesa')
    expect(wrapper.text()).toContain('Meta')
    expect(wrapper.text()).toContain('Orçamento')
  })
})
