import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AlertaErro from '../AlertaErro.vue'

describe('AlertaErro.vue / AlertaFeedback', () => {
  it('aplica classes de erro (vermelho) por padrão para manter compatibilidade', () => {
    const wrapper = mount(AlertaErro, {
      props: { mensagem: 'Ocorreu uma falha no servidor' },
    })

    const root = wrapper.find('[role="alert"]')
    expect(root.classes()).toContain('border-red')
    const icone = wrapper.find('i')
    expect(icone.classes()).toContain('text-red')
    expect(icone.classes()).toContain('bi-exclamation-triangle')
    expect(wrapper.text()).toContain('Ocorreu uma falha no servidor')
  })

  it('aplica classes de sucesso completo (verde) quando tipo="sucesso"', () => {
    const wrapper = mount(AlertaErro, {
      props: {
        tipo: 'sucesso',
        mensagem: 'Operação realizada com sucesso!',
      },
    })

    const root = wrapper.find('[role="alert"]')
    expect(root.classes()).toContain('border-green')
    const icone = wrapper.find('i')
    expect(icone.classes()).toContain('text-green')
    expect(icone.classes()).toContain('bi-check-circle-fill')
    expect(wrapper.text()).toContain('Operação realizada com sucesso!')
  })

  it('aplica classes de sucesso parcial / atenção (laranja) quando tipo="aviso" ou tipo="sucesso_parcial"', () => {
    const wrapperAviso = mount(AlertaErro, {
      props: {
        tipo: 'aviso',
        mensagem: 'Importação concluída com pendências de aviso.',
      },
    })

    expect(wrapperAviso.find('[role="alert"]').classes()).toContain('border-orange')
    expect(wrapperAviso.find('i').classes()).toContain('text-orange')
    expect(wrapperAviso.find('i').classes()).toContain('bi-exclamation-triangle')

    const wrapperParcial = mount(AlertaErro, {
      props: {
        tipo: 'sucesso_parcial',
        mensagem: 'Sucesso parcial verificado.',
      },
    })

    expect(wrapperParcial.find('[role="alert"]').classes()).toContain('border-orange')
    expect(wrapperParcial.find('i').classes()).toContain('text-orange')
  })

  it('renderiza conteúdo customizado via slot padrão', () => {
    const wrapper = mount(AlertaErro, {
      props: { tipo: 'sucesso' },
      slots: {
        default: '<span class="custom-content">Mensagem detalhada</span>',
      },
    })

    expect(wrapper.find('.custom-content').exists()).toBe(true)
    expect(wrapper.find('.custom-content').text()).toBe('Mensagem detalhada')
  })
})
