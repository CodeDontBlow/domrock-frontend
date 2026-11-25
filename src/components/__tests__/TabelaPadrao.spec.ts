import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TabelaPadrao from '../TabelaPadrao.vue'

describe('TabelaPadrao (Componente Universal de Tabela)', () => {
  const colunasTeste = [
    { chave: 'titulo', titulo: 'Título', icone: 'bi bi-tag' },
    { chave: 'data', titulo: 'Data', icone: 'bi bi-calendar' },
    { chave: 'valor', titulo: 'Valor', align: 'right' as const },
  ]

  const dadosTeste = [
    { id: 1, titulo: 'Campanha A', data: '10/01/2026', valor: '100' },
    { id: 2, titulo: 'Campanha B', data: '15/02/2026', valor: '200' },
    { id: 3, titulo: 'Campanha C', data: '01/03/2026', valor: '50' },
    { id: 4, titulo: 'Campanha D', data: '05/04/2026', valor: '300' },
  ]

  it('renderiza os filtros de ordenação, cabeçalhos com ícones e as linhas', () => {
    const wrapper = mount(TabelaPadrao, {
      props: {
        colunas: colunasTeste,
        dados: dadosTeste,
      },
    })

    // Filtros
    expect(wrapper.find('.table-filters').exists()).toBe(true)
    expect(wrapper.find('label[for="ordenar-por"]').text()).toBe('Ordenando por')
    expect(wrapper.find('label[for="ordem"]').text()).toBe('em ordem')

    // Cabeçalhos
    const ths = wrapper.findAll('th')
    expect(ths).toHaveLength(3)
    expect(ths[0]!.text()).toBe('Título')
    expect(ths[0]!.find('i.bi-tag').exists()).toBe(true)
    expect(ths[1]!.text()).toBe('Data')
    expect(ths[1]!.find('i.bi-calendar').exists()).toBe(true)

    // Linhas
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(4)
  })

  it('emite o evento selecionar ao clicar em uma linha', async () => {
    const wrapper = mount(TabelaPadrao, {
      props: {
        colunas: colunasTeste,
        dados: dadosTeste,
      },
    })

    const primeiraLinha = wrapper.findAll('tbody tr')[0]!
    await primeiraLinha.trigger('click')

    expect(wrapper.emitted('selecionar')).toHaveLength(1)
    expect(wrapper.emitted('selecionar')![0]![0]).toEqual(dadosTeste[0])
  })

  it('ordena os registros de acordo com a coluna e direção selecionadas', async () => {
    const wrapper = mount(TabelaPadrao, {
      props: {
        colunas: colunasTeste,
        dados: dadosTeste,
        colunaOrdenacaoPadrao: 'titulo',
        ordemPadrao: 'crescente',
      },
    })

    // Em ordem crescente por título: Campanha A, B, C, D
    let firstTd = wrapper.findAll('tbody tr td')[0]!
    expect(firstTd.text()).toBe('Campanha A')

    // Muda ordem para decrescente
    const selectOrdem = wrapper.find('#ordem')
    await selectOrdem.setValue('decrescente')

    // Primeiro item passa a ser Campanha D
    firstTd = wrapper.findAll('tbody tr td')[0]!
    expect(firstTd.text()).toBe('Campanha D')
  })

  it('executa a paginação corretamente quando excede itensPorPagina', async () => {
    const wrapper = mount(TabelaPadrao, {
      props: {
        colunas: colunasTeste,
        dados: dadosTeste,
        itensPorPagina: 2,
      },
    })

    // Com 4 itens e 2 por página -> 2 páginas
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)

    const nav = wrapper.find('.pagination')
    expect(nav.exists()).toBe(true)

    const botoesPagina = wrapper.findAll('.page-button')
    expect(botoesPagina).toHaveLength(2)
    expect(botoesPagina[0]!.classes()).toContain('active')

    // Avança para a página 2
    const btnProximo = wrapper.findAll('.navigation-button')[1]!
    await btnProximo.trigger('click')

    expect(botoesPagina[1]!.classes()).toContain('active')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('permite customizar o conteúdo da célula via slot', () => {
    const wrapper = mount(TabelaPadrao, {
      props: {
        colunas: colunasTeste,
        dados: dadosTeste.slice(0, 1),
      },
      slots: {
        'cell-valor': `<template #cell-valor="{ valor }"><span class="badge-custom">R$ {{ valor }}</span></template>`,
      },
    })

    const badge = wrapper.find('.badge-custom')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('R$ 100')
  })

  it('exibe mensagem quando não há dados', () => {
    const wrapper = mount(TabelaPadrao, {
      props: {
        colunas: colunasTeste,
        dados: [],
        mensagemVazia: 'Sem dados no momento',
      },
    })

    expect(wrapper.find('.empty-state').text()).toBe('Sem dados no momento')
    expect(wrapper.find('.pagination').exists()).toBe(false)
  })
})
