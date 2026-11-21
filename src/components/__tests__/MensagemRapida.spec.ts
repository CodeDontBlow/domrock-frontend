import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MensagemRapida from '../MensagemRapida.vue'
import { useMensagemRapida } from '@/composables/useMensagemRapida'

describe('MensagemRapida.vue', () => {
  it('renderiza sucesso com paleta verde por padrão', () => {
    const wrapper = mount(MensagemRapida, {
      props: { mensagem: 'Campanha aprovada com sucesso!' },
    })

    const root = wrapper.find('[role="status"]')
    expect(root.classes()).toContain('border-green')
    expect(root.find('i.bi-check-circle-fill.text-green').exists()).toBe(true)
    expect(wrapper.text()).toContain('Campanha aprovada com sucesso!')
    expect(wrapper.text()).toContain('Sucesso')
  })

  it('renderiza sucesso parcial / aviso com paleta laranja', () => {
    const wrapper = mount(MensagemRapida, {
      props: {
        tipo: 'sucesso_parcial',
        mensagem: 'Importado com 2 avisos não impeditivos.',
        titulo: 'Atenção aos avisos',
      },
    })

    const root = wrapper.find('[role="status"]')
    expect(root.classes()).toContain('border-orange')
    expect(root.find('i.bi-exclamation-triangle-fill.text-orange').exists()).toBe(true)
    expect(wrapper.text()).toContain('Atenção aos avisos')
    expect(wrapper.text()).toContain('Importado com 2 avisos não impeditivos.')
  })

  it('renderiza erro com paleta vermelha', () => {
    const wrapper = mount(MensagemRapida, {
      props: {
        tipo: 'erro',
        mensagem: 'Falha ao salvar dados.',
      },
    })

    const root = wrapper.find('[role="status"]')
    expect(root.classes()).toContain('border-red')
    expect(root.find('i.bi-x-circle-fill.text-red').exists()).toBe(true)
  })

  it('emite evento "fechar" ao clicar no botão fechar', async () => {
    const wrapper = mount(MensagemRapida, {
      props: { mensagem: 'Teste fechar' },
    })

    const btnFechar = wrapper.find('button[aria-label="Fechar notificação"]')
    expect(btnFechar.exists()).toBe(true)
    await btnFechar.trigger('click')

    expect(wrapper.emitted('fechar')).toHaveLength(1)
  })
})

describe('useMensagemRapida composable', () => {
  it('gerencia notificações e helpers de tipo', () => {
    const { notificacoes, sucesso, sucessoParcial, erro, limpar, remover } = useMensagemRapida()
    limpar()

    const id1 = sucesso('Tudo certo!')
    expect(notificacoes.value).toHaveLength(1)
    expect(notificacoes.value[0]?.tipo).toBe('sucesso')

    const id2 = sucessoParcial('Atenção aos detalhes')
    expect(notificacoes.value).toHaveLength(2)
    expect(notificacoes.value[1]?.tipo).toBe('sucesso_parcial')

    remover(id1)
    expect(notificacoes.value).toHaveLength(1)
    expect(notificacoes.value[0]?.id).toBe(id2)

    limpar()
    expect(notificacoes.value).toHaveLength(0)
  })
})
