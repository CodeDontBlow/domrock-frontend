import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CardSolicitacaoCorrecaoBase from '../components/CardSolicitacaoCorrecaoBase.vue'
import CardSolicitacaoIntercorrencia from '../components/CardSolicitacaoIntercorrencia.vue'

describe('CardSolicitacaoCorrecaoBase (Figma 968:3323)', () => {
  it('renderiza o cabeçalho, selo e os valores de comparação corretamente', () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        valorAnterior: 'MAT-1 na loja LOJA-1',
        valorAposMudanca: 'MAT-1 na loja LOJA-2',
        tipo: 'Atualização',
        matriculas: ['MAT-1'],
        competencia: '11/2025',
        motivo: 'Transferência de loja',
      },
    })

    expect(wrapper.text()).toContain('Solicitação de Correção de Dados')
    expect(wrapper.text()).toContain('Feito com Lana')
    expect(wrapper.text()).toContain('VALOR ANTERIOR')
    expect(wrapper.text()).toContain('MAT-1 na loja LOJA-1')
    expect(wrapper.text()).toContain('VALOR APÓS MUDANÇA')
    expect(wrapper.text()).toContain('MAT-1 na loja LOJA-2')
    expect(wrapper.text()).toContain('Atualização')
    expect(wrapper.text()).toContain('11/2025')
  })

  it('permite alterar o motivo e emite salvar-motivo automaticamente', async () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        motivo: 'Motivo original',
      },
    })

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Novo motivo corrigido')

    expect(wrapper.emitted('salvar-motivo')).toEqual([['Novo motivo corrigido']])
  })

  it('emite solicitar e cancelar ao clicar nos respectivos botões', async () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        motivo: 'Meu motivo',
      },
    })

    await wrapper.find('.btn-solicitar').trigger('click')
    expect(wrapper.emitted('solicitar')).toEqual([['Meu motivo']])

    await wrapper.find('.btn-cancelar').trigger('click')
    expect(wrapper.emitted('cancelar')).toBeDefined()
  })

  it('não exibe caixa de status em estado de rascunho', () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        status: 'rascunho',
        enviada: false,
        erro: null,
      },
    })

    expect(wrapper.find('.status-solicitacao').exists()).toBe(false)
  })

  it('exibe status laranja de envio para supervisão quando status é enviada', () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        status: 'enviada',
      },
    })

    const statusBox = wrapper.find('.status-enviada')
    expect(statusBox.exists()).toBe(true)
    expect(statusBox.classes()).toContain('border-orange')
    expect(statusBox.find('.bi-clock-history').exists()).toBe(true)
    expect(statusBox.text()).toContain('Solicitação enviada para a análise dos supervisores!')
    expect(wrapper.find('.btn-solicitar').attributes('disabled')).toBeDefined()
  })

  it('exibe status azul de aprovação quando status é aprovada', () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        status: 'aprovada',
      },
    })

    const statusBox = wrapper.find('.status-aprovada')
    expect(statusBox.exists()).toBe(true)
    expect(statusBox.classes()).toContain('border-blue')
    expect(statusBox.find('.bi-check-circle-fill').exists()).toBe(true)
    expect(statusBox.text()).toContain('Solicitação aprovada e aplicada!')
    expect(wrapper.find('.btn-solicitar').attributes('disabled')).toBeDefined()
  })

  it('exibe status vermelho com mensagem de erro quando há erro', () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        status: 'erro',
        erro: 'Falha ao salvar no banco de dados',
      },
    })

    const statusBox = wrapper.find('.status-erro')
    expect(statusBox.exists()).toBe(true)
    expect(statusBox.classes()).toContain('border-red')
    expect(statusBox.find('.bi-exclamation-triangle-fill').exists()).toBe(true)
    expect(statusBox.text()).toContain('Falha ao salvar no banco de dados')
  })
})

describe('CardSolicitacaoIntercorrencia (Figma 964:3251)', () => {
  it('renderiza título, datas de início/fim e matrículas', () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        tipo: 'Licença-Maternidade',
        dataInicio: '10/01/2026',
        dataFim: '10/07/2026',
        matriculas: ['MAT-10', 'MAT-20'],
        motivo: 'Licença maternidade 6 meses',
      },
    })

    expect(wrapper.text()).toContain('Solicitação de Abertura de Intercorrência')
    expect(wrapper.text()).toContain('Feito com Lana')
    expect(wrapper.text()).toContain('Licença-Maternidade')
    expect(wrapper.text()).toContain('10/01/2026')
    expect(wrapper.text()).toContain('10/07/2026')
    expect(wrapper.text()).toContain('MAT-10')
    expect(wrapper.text()).toContain('MAT-20')
  })

  it('permite alterar o motivo e emite salvar-motivo automaticamente', async () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        motivo: 'Motivo inicial',
      },
    })

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Motivo alterado automaticamente')

    expect(wrapper.emitted('salvar-motivo')).toEqual([['Motivo alterado automaticamente']])
  })

  it('emite solicitar e cancelar nos botões de ação', async () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        motivo: 'Motivo de teste',
      },
    })

    await wrapper.find('.btn-solicitar').trigger('click')
    expect(wrapper.emitted('solicitar')).toEqual([['Motivo de teste']])

    await wrapper.find('.btn-cancelar').trigger('click')
    expect(wrapper.emitted('cancelar')).toBeDefined()
  })

  it('não exibe caixa de status em estado de rascunho', () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        status: 'rascunho',
        enviada: false,
        erro: null,
      },
    })

    expect(wrapper.find('.status-solicitacao').exists()).toBe(false)
  })

  it('exibe status laranja de envio para supervisão quando status é enviada', () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        status: 'enviada',
      },
    })

    const statusBox = wrapper.find('.status-enviada')
    expect(statusBox.exists()).toBe(true)
    expect(statusBox.classes()).toContain('border-orange')
    expect(statusBox.find('.bi-clock-history').exists()).toBe(true)
    expect(statusBox.text()).toContain('Solicitação enviada para a análise dos supervisores!')
    expect(wrapper.find('.btn-solicitar').attributes('disabled')).toBeDefined()
  })

  it('exibe status azul de aprovação quando status é aprovada', () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        status: 'aprovada',
      },
    })

    const statusBox = wrapper.find('.status-aprovada')
    expect(statusBox.exists()).toBe(true)
    expect(statusBox.classes()).toContain('border-blue')
    expect(statusBox.find('.bi-check-circle-fill').exists()).toBe(true)
    expect(statusBox.text()).toContain('Solicitação aprovada e aplicada!')
    expect(wrapper.find('.btn-solicitar').attributes('disabled')).toBeDefined()
  })

  it('exibe status vermelho com mensagem de erro quando há erro', () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        status: 'erro',
        erro: 'Erro de conexão com o servidor',
      },
    })

    const statusBox = wrapper.find('.status-erro')
    expect(statusBox.exists()).toBe(true)
    expect(statusBox.classes()).toContain('border-red')
    expect(statusBox.find('.bi-exclamation-triangle-fill').exists()).toBe(true)
    expect(statusBox.text()).toContain('Erro de conexão com o servidor')
  })
})
