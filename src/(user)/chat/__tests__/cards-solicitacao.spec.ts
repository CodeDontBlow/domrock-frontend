import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CardSolicitacaoCorrecaoBase from '../components/CardSolicitacaoCorrecaoBase.vue'
import CardSolicitacaoIntercorrencia from '../components/CardSolicitacaoIntercorrencia.vue'

describe('CardSolicitacaoCorrecaoBase (Figma 968:3323)', () => {
  it('renderiza o cabeçalho, selo e os valores de comparação corretamente', () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        antes: 'MAT-1 na loja LOJA-1',
        depois: 'MAT-1 na loja LOJA-2',
        tipo: 'Atualização',
        matricula: 'MAT-1',
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

  it('exibe os rótulos personalizados antes_rotulo, depois_rotulo e tipo_rotulo', () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        tipo: 'TRANSFERENCIA_LOJA',
        tipo_rotulo: 'Transferência de loja',
        antes: '33',
        depois: '8',
        antes_rotulo: 'MATRIC-38 na loja 33',
        depois_rotulo: 'MATRIC-38 na loja 8',
        matricula: 'MATRIC-38',
        competencia: '2025-10',
        motivo: 'Mudança',
      },
    })
    expect(wrapper.text()).toContain('Transferência de loja')
    expect(wrapper.text()).toContain('MATRIC-38 na loja 33')
    expect(wrapper.text()).toContain('MATRIC-38 na loja 8')
  })

  it('não inventa valores padrão quando faltam campos na correção da base', () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        motivo: 'Apenas motivo',
      },
    })
    expect(wrapper.text()).not.toContain('Atualização')
    expect(wrapper.text()).not.toContain('11/2025')
    expect(wrapper.text()).not.toContain('MAT-102')
  })
})

describe('CardSolicitacaoIntercorrencia (Figma 964:3251)', () => {
  it('renderiza título, datas de início/fim e matrícula', () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        tipo: 'Licença-Maternidade',
        depois: {
          data_inicio: '10/01/2026',
          data_fim: '10/07/2026',
        },
        matricula: 'MAT-10',
        motivo: 'Licença maternidade 6 meses',
      },
    })

    expect(wrapper.text()).toContain('Solicitação de Abertura de Intercorrência')
    expect(wrapper.text()).toContain('Feito com Lana')
    expect(wrapper.text()).toContain('Licença-Maternidade')
    expect(wrapper.text()).toContain('10/01/2026')
    expect(wrapper.text()).toContain('10/07/2026')
    expect(wrapper.text()).toContain('MAT-10')
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

  it('exibe os rótulos tipo_rotulo e depois_rotulo', () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        tipo: 'FERIAS',
        tipo_rotulo: 'Férias',
        depois: { data_inicio: '2025-12-01', data_fim: '2025-12-15' },
        depois_rotulo: 'Férias de 01/12/2025 a 15/12/2025',
        matricula: 'MATRIC-12',
        motivo: 'Férias programadas',
      },
    })
    expect(wrapper.text()).toContain('Férias')
    expect(wrapper.text()).toContain('Férias de 01/12/2025 a 15/12/2025')
  })

  it('não inventa valores padrão quando faltam campos na intercorrência', () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        motivo: 'Apenas motivo',
      },
    })
    expect(wrapper.text()).not.toContain('17/03/2026')
    expect(wrapper.text()).not.toContain('16/11/2026')
    expect(wrapper.text()).not.toContain('Licença-Maternidade')
  })

  it('valida que a data final precisa ser igual ou posterior à inicial', () => {
    const wrapper = mount(CardSolicitacaoIntercorrencia, {
      props: {
        depois: {
          data_inicio: '2025-12-15',
          data_fim: '2025-12-01',
        },
        motivo: 'Datas invertidas',
      },
    })
    expect(wrapper.text()).toContain('A data final precisa ser igual ou posterior à inicial')
    expect(wrapper.find('.btn-solicitar').attributes('disabled')).toBeDefined()
  })
})
