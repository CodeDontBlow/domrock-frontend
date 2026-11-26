import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CartaoPedido from '../components/CartaoPedido.vue'
import CardSolicitacaoCorrecaoBase from '../components/CardSolicitacaoCorrecaoBase.vue'
import CardSolicitacaoIntercorrencia from '../components/CardSolicitacaoIntercorrencia.vue'
import type { MensagemChat, SolicitacaoCorrecaoChat } from '../types'

describe('CartaoPedido.vue', () => {
  it('renderiza CardSolicitacaoCorrecaoBase quando categoria for CORRECAO', () => {
    const solicitacao: SolicitacaoCorrecaoChat = {
      categoria: 'CORRECAO',
      tipo: 'TRANSFERENCIA_LOJA',
      tipo_rotulo: 'Transferência de loja',
      matricula: 'MATRIC-38',
      competencia: '2025-10',
      antes: '33',
      depois: '8',
      antes_rotulo: 'MATRIC-38 na loja 33',
      depois_rotulo: 'MATRIC-38 na loja 8',
      motivo: 'Mudança de filial',
    }

    const wrapper = mount(CartaoPedido, {
      props: { solicitacao },
    })

    expect(wrapper.findComponent(CardSolicitacaoCorrecaoBase).exists()).toBe(true)
    expect(wrapper.findComponent(CardSolicitacaoIntercorrencia).exists()).toBe(false)
    expect(wrapper.text()).toContain('Solicitação de Correção de Dados')
    expect(wrapper.text()).toContain('MATRIC-38 na loja 33')
  })

  it('renderiza CardSolicitacaoIntercorrencia quando categoria for INTERCORRENCIA', () => {
    const solicitacao: SolicitacaoCorrecaoChat = {
      categoria: 'INTERCORRENCIA',
      tipo: 'FERIAS',
      tipo_rotulo: 'Férias',
      matricula: 'MATRIC-12',
      competencia: '2025-12',
      depois: { data_inicio: '2025-12-01', data_fim: '2025-12-15' },
      depois_rotulo: 'Férias de 01/12/2025 a 15/12/2025',
      motivo: 'Férias regulares',
    }

    const wrapper = mount(CartaoPedido, {
      props: { solicitacao },
    })

    expect(wrapper.findComponent(CardSolicitacaoIntercorrencia).exists()).toBe(true)
    expect(wrapper.findComponent(CardSolicitacaoCorrecaoBase).exists()).toBe(false)
    expect(wrapper.text()).toContain('Solicitação de Abertura de Intercorrência')
    expect(wrapper.text()).toContain('Férias de 01/12/2025 a 15/12/2025')
  })

  it('aceita mensagem em vez de solicitacao direta', () => {
    const mensagem: MensagemChat = {
      id: 1,
      chave: 'm-1',
      papel: 'agente',
      texto: 'Veja o pedido',
      solicitacao: {
        categoria: 'CORRECAO',
        tipo: 'TROCA_CARGO',
        competencia: '2025-10',
        motivo: 'Promoção',
      },
    }

    const wrapper = mount(CartaoPedido, {
      props: { mensagem },
    })

    expect(wrapper.findComponent(CardSolicitacaoCorrecaoBase).exists()).toBe(true)
    expect(wrapper.text()).toContain('Solicitação de Correção de Dados')
  })

  it('repassa eventos confirmar e desistir disparados pelo card interno', async () => {
    const solicitacao: SolicitacaoCorrecaoChat = {
      categoria: 'CORRECAO',
      tipo: 'TRANSFERENCIA_LOJA',
      competencia: '2025-10',
      motivo: 'Motivo teste',
    }

    const wrapper = mount(CartaoPedido, {
      props: { solicitacao },
    })

    const card = wrapper.findComponent(CardSolicitacaoCorrecaoBase)

    card.vm.$emit('solicitar', 'Motivo confirmado')
    expect(wrapper.emitted('confirmar')).toEqual([['Motivo confirmado']])
    expect(wrapper.emitted('solicitar')).toEqual([['Motivo confirmado']])

    card.vm.$emit('cancelar')
    expect(wrapper.emitted('desistir')).toBeDefined()
    expect(wrapper.emitted('cancelar')).toBeDefined()

    card.vm.$emit('salvar-motivo', 'Motivo editado')
    expect(wrapper.emitted('salvar-motivo')).toEqual([['Motivo editado']])
  })

  it('não renderiza nada se não houver solicitação nem mensagem', () => {
    const wrapper = mount(CartaoPedido, {
      props: {},
    })

    expect(wrapper.find('.cartao-pedido-container').exists()).toBe(false)
  })
})
