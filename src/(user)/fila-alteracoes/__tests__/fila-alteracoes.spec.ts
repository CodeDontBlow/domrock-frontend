import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Page from '../Page.vue'
import CardFilaBase from '../components/CardFilaBase.vue'
import CardFilaIntercorrencia from '../components/CardFilaIntercorrencia.vue'
import TabelaHistoricoSolicitacoes from '../components/TabelaHistoricoSolicitacoes.vue'
import ModalDetalheSolicitacao from '../components/ModalDetalheSolicitacao.vue'
import { definirServicoCorrecoes, criarServicoCorrecoes } from '../services/correcoes'
import { criarSolicitacaoFake, criarIntercorrenciaFake, FakeServicoCorrecoes } from './fakes'

describe('Página Fila de Alterações / Solicitações (Page.vue)', () => {
  let fakeServico: FakeServicoCorrecoes

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('perfil', 'SUPERVISOR')
    fakeServico = new FakeServicoCorrecoes()
    definirServicoCorrecoes(fakeServico as unknown as ReturnType<typeof criarServicoCorrecoes>)
  })

  it('carrega e exibe a lista vinda da API na fila e em Meus pedidos', async () => {
    fakeServico.fila = [criarSolicitacaoFake({ id: 101, motivo: 'Correção de loja pendente' })]
    fakeServico.minhas = [criarSolicitacaoFake({ id: 201, motivo: 'Meu pedido de teste' })]

    const wrapper = mount(Page)
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe('Solicitações de Alteração')
    expect(wrapper.text()).toContain('Correção de loja pendente')
    expect(wrapper.text()).toContain('Meus pedidos')
    expect(wrapper.text()).toContain('Meu pedido de teste')
  })

  it('exibe selo "Aberta pela Lana a pedido de {autor.nome}" quando origem é LANA', async () => {
    fakeServico.fila = [
      criarSolicitacaoFake({
        id: 102,
        origem: 'LANA',
        autor: { id: 7, nome: 'Roberval Silva' },
      }),
    ]

    const wrapper = mount(Page)
    await flushPromises()

    const card = wrapper.findComponent(CardFilaBase)
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('Aberta pela Lana a pedido de Roberval Silva')
  })

  it('aprova uma solicitação e recarrega a lista', async () => {
    fakeServico.fila = [criarSolicitacaoFake({ id: 301, motivo: 'Troca de cargo para aprovar' })]

    const wrapper = mount(Page)
    await flushPromises()

    const card = wrapper.findComponent(CardFilaBase)
    await card.trigger('click')

    const modal = wrapper.findComponent(ModalDetalheSolicitacao)
    expect(modal.exists()).toBe(true)

    // Clica no botão Aprovar
    const btnAprovar = modal.find('.btn-aprovar')
    expect(btnAprovar.exists()).toBe(true)
    await btnAprovar.trigger('click')
    await flushPromises()

    expect(fakeServico.decisoes).toEqual([
      { id: 301, decisao: 'APROVAR', justificativa: undefined },
    ])
  })

  it('reprova sem justificativa exibe erro no modal sem chamar a API', async () => {
    fakeServico.fila = [
      criarSolicitacaoFake({ id: 401, motivo: 'Pedido para teste de reprovação' }),
    ]

    const wrapper = mount(Page)
    await flushPromises()

    const card = wrapper.findComponent(CardFilaBase)
    await card.trigger('click')

    const modal = wrapper.findComponent(ModalDetalheSolicitacao)
    expect(modal.exists()).toBe(true)

    // Clica em Reprovar para abrir o diálogo de justificativa
    await modal.find('.btn-reprovar').trigger('click')

    // Clica em Confirmar Reprovação sem preencher justificativa
    await modal.find('.btn-confirmar-reprovacao').trigger('click')
    await flushPromises()

    expect(modal.find('.erro-justificativa').text()).toBe('Justificativa obrigatória para reprovar')
    expect(fakeServico.decisoes).toHaveLength(0)
  })

  it('reprova com justificativa chama a API e recarrega a lista', async () => {
    fakeServico.fila = [criarSolicitacaoFake({ id: 501, motivo: 'Pedido a reprovar com motivo' })]

    const wrapper = mount(Page)
    await flushPromises()

    const card = wrapper.findComponent(CardFilaBase)
    await card.trigger('click')

    const modal = wrapper.findComponent(ModalDetalheSolicitacao)
    await modal.find('.btn-reprovar').trigger('click')

    // Preenche a justificativa
    await modal.find('textarea.campo-justificativa').setValue('Dados inconsistentes com o sistema')
    await modal.find('.btn-confirmar-reprovacao').trigger('click')
    await flushPromises()

    expect(fakeServico.decisoes).toEqual([
      {
        id: 501,
        decisao: 'REPROVAR',
        justificativa: 'Dados inconsistentes com o sistema',
      },
    ])
  })

  it('exibe erro 409 com texto do contrato quando a base mudou', async () => {
    fakeServico.fila = [criarSolicitacaoFake({ id: 601 })]
    fakeServico.falhaDecidir = { response: { status: 409 } }

    const wrapper = mount(Page)
    await flushPromises()

    await wrapper.findComponent(CardFilaBase).trigger('click')
    const modal = wrapper.findComponent(ModalDetalheSolicitacao)
    await modal.find('.btn-aprovar').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('A base mudou desde o pedido')
  })

  it('exibe erro 403 com texto do contrato quando outra pessoa precisa aprovar', async () => {
    fakeServico.fila = [criarSolicitacaoFake({ id: 701 })]
    fakeServico.falhaDecidir = { response: { status: 403 } }

    const wrapper = mount(Page)
    await flushPromises()

    await wrapper.findComponent(CardFilaBase).trigger('click')
    const modal = wrapper.findComponent(ModalDetalheSolicitacao)
    await modal.find('.btn-aprovar').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Outra pessoa precisa aprovar esta correção')
  })

  it('exibe a message do backend em caso de erro retornado pela API', async () => {
    fakeServico.fila = [criarSolicitacaoFake({ id: 801 })]
    fakeServico.falhaDecidir = {
      response: { status: 400, data: { message: 'Mensagem customizada do backend' } },
    }

    const wrapper = mount(Page)
    await flushPromises()

    await wrapper.findComponent(CardFilaBase).trigger('click')
    const modal = wrapper.findComponent(ModalDetalheSolicitacao)
    await modal.find('.btn-aprovar').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Mensagem customizada do backend')
  })

  it('exibe estado vazio de "Meus pedidos" com mensagem clara', async () => {
    fakeServico.fila = []
    fakeServico.minhas = []

    const wrapper = mount(Page)
    await flushPromises()

    expect(wrapper.text()).toContain('Meus pedidos')
    expect(wrapper.text()).toContain('Nenhum pedido encontrado em Meus pedidos.')
  })

  it('Gerente não vê seção de pendentes e não chama listarFila', async () => {
    localStorage.setItem('perfil', 'GERENTE')
    const spyFila = vi.spyOn(fakeServico, 'listarFila')

    const wrapper = mount(Page)
    await flushPromises()

    expect(spyFila).not.toHaveBeenCalled()
    expect(wrapper.find('.approvals-section').exists()).toBe(false)
    expect(wrapper.text()).toContain('Meus pedidos')
  })
})

describe('CardFilaBase (Figma 984:3544)', () => {
  it('renderiza os dados de tipo, competência e comparativo', () => {
    const wrapper = mount(CardFilaBase, {
      props: {
        solicitacao: {
          id: 1,
          tipo: 'TRANSFERENCIA_LOJA',
          competencia: 'nov/2025',
          matricula: 'MAT-1',
          motivo: 'Transferência de loja',
          antes: 'Valor antigo',
          depois: 'Valor novo',
          origem: 'USUARIO',
          autor: { id: 1, nome: 'Roberval Silva' },
          submetidoEm: '16/11',
          status: 'PENDENTE',
        },
      },
    })

    expect(wrapper.text()).toContain('Transferência de loja')
    expect(wrapper.text()).toContain('nov/2025')
    expect(wrapper.text()).toContain('Valor antigo')
    expect(wrapper.text()).toContain('Valor novo')
    expect(wrapper.text()).toContain('Solicitado por Roberval Silva')
    expect(wrapper.text()).toContain('Submetido em 16/11')
  })
})

describe('CardFilaIntercorrencia (Figma 996:4945)', () => {
  it('renderiza o timeline de período e motivo', () => {
    const wrapper = mount(CardFilaIntercorrencia, {
      props: {
        solicitacao: {
          id: 101,
          tipo: 'LICENCA_MATERNIDADE',
          matricula: 'MAT-102',
          inicio: '17/03',
          fim: '16/11',
          motivo: 'Licença maternidade',
          origem: 'USUARIO',
          autor: { id: 1, nome: 'Roberval Silva' },
          submetidoEm: '16/11',
          status: 'PENDENTE',
        },
      },
    })

    expect(wrapper.text()).toContain('Licença-maternidade')
    expect(wrapper.text()).toContain('17/03')
    expect(wrapper.text()).toContain('16/11')
    expect(wrapper.text()).toContain('Licença maternidade')
    expect(wrapper.text()).toContain('Solicitado por Roberval Silva')
  })
})

describe('TabelaHistoricoSolicitacoes (Figma 1009:4979 e 1009:5272)', () => {
  it('renderiza colunas de histórico de correção com competência', () => {
    const wrapper = mount(TabelaHistoricoSolicitacoes, {
      props: {
        tipoVisualizacao: 'correcao',
        itens: [
          {
            id: 'H1',
            motivo: 'Motivo de teste',
            tipo: 'Transferência de loja',
            competencia: '11/2025',
            matriculas: 'MAT-1',
            status: 'Aprovado',
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Competência')
    expect(wrapper.text()).toContain('Motivo de teste')
    expect(wrapper.text()).toContain('11/2025')
    expect(wrapper.text()).toContain('Aprovado')
  })

  it('renderiza colunas de histórico de intercorrência com período', () => {
    const wrapper = mount(TabelaHistoricoSolicitacoes, {
      props: {
        tipoVisualizacao: 'intercorrencia',
        itens: [
          {
            id: 'HI1',
            motivo: 'Afastamento médico',
            tipo: 'Afastamento',
            periodo: '01/08/2025 - 30/09/2025',
            matriculas: 'MAT-88',
            status: 'Reprovado',
            justificativa: 'Falta atestado',
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Período')
    expect(wrapper.text()).toContain('Afastamento médico')
    expect(wrapper.text()).toContain('Reprovado')
    expect(wrapper.text()).toContain('Falta atestado')
  })
})
