import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { router } from '@/router'
import Sidebar from '@/components/Sidebar.vue'
import BotoesCampanha from '../../campanhas/components/BotoesCampanha.vue'
import ResultadoSimulacao from '../../chat/components/ResultadoSimulacao.vue'
import { resultadoBlackFriday } from '../../chat/__tests__/fakes'
import { atualizarPerfil } from '@/composables/usePerfil'

enableAutoUnmount(afterEach)
function entrar(perfil: string) {
  localStorage.setItem('token', 'teste')
  localStorage.setItem('perfil', perfil)
  atualizarPerfil()
}
beforeEach(() => {
  localStorage.clear()
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} })
})
afterEach(() => {
  localStorage.clear()
  atualizarPerfil()
})

describe('rota exclusiva do Auditor', () => {
  it('sem token vai para login', async () => {
    await router.push('/auditoria')
    expect(router.currentRoute.value.name).toBe('login')
  })
  it.each(['GERENTE', 'SUPERVISOR', 'ADMIN'])('%s não entra por URL direta', async (perfil) => {
    entrar(perfil)
    await router.push('/auditoria/campanhas/12')
    expect(router.currentRoute.value.name).toBe(perfil === 'ADMIN' ? 'users' : 'chat')
  })
  it('Auditor vai para Auditoria após login e preserva URL do detalhe no F5', async () => {
    entrar('AUDITOR')
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('auditoria')
    await router.push('/auditoria/campanhas/12')
    expect(router.currentRoute.value.name).toBe('auditoria-campanha')
    expect(router.currentRoute.value.params.id).toBe('12')
  })
  it.each(['/', '/campanha', '/campanhas/12', '/importar', '/admin', '/vigente'])(
    'Auditor não alcança %s',
    async (url) => {
      entrar('AUDITOR')
      await router.push(url)
      expect(router.currentRoute.value.name).toBe('auditoria')
    },
  )
  it('menu do Auditor contém somente Auditoria e não carrega seus chats', async () => {
    entrar('AUDITOR')
    const wrapper = mount(Sidebar, { global: { plugins: [router, createPinia()] } })
    await flushPromises()
    expect(wrapper.findAll('.menu-label').map((el) => el.text())).toEqual(['Auditoria'])
    expect(wrapper.find('.sidebar-chats').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/Nova Campanha|Importar base/)
  })
  it('oculta ações mesmo que o backend envie permissões de escrita', () => {
    entrar('AUDITOR')
    const wrapper = mount(BotoesCampanha, {
      props: {
        acoes: ['EDITAR', 'SUBMETER', 'ARQUIVAR', 'RENOMEAR'],
        status: 'APROVADA',
        agindo: false,
      },
    })
    expect(wrapper.findAll('button')).toHaveLength(0)
  })
  it('resultado conserva cenários e números sem botão Usar no painel', () => {
    entrar('AUDITOR')
    const wrapper = mount(ResultadoSimulacao, { props: { resultado: resultadoBlackFriday() } })
    expect(wrapper.text()).toContain('Resultado da simulação')
    expect(wrapper.text()).toContain('Acréscimo menor')
    expect(wrapper.findAll('button').some((el) => el.text().includes('Usar no painel'))).toBe(false)
  })
})
