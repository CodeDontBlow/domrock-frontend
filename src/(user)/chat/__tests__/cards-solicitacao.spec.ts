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

  it('permite alterar o motivo e emite salvar-motivo', async () => {
    const wrapper = mount(CardSolicitacaoCorrecaoBase, {
      props: {
        motivo: 'Motivo original',
      },
    })

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Novo motivo corrigido')

    const btnSalvar = wrapper.find('.botao-salvar')
    await btnSalvar.trigger('click')

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
})
