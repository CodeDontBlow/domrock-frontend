import { afterEach, describe, expect, it, vi } from 'vitest'
import { atualizarPerfil, lerPerfil, rotaInicial, usePerfil } from '../usePerfil'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  atualizarPerfil()
})

describe('perfil centralizado', () => {
  it.each(['AUDITOR', 'ADMIN', 'GERENTE', 'SUPERVISOR'] as const)('reconhece %s', (perfil) => {
    localStorage.setItem('perfil', perfil)
    expect(lerPerfil()).toBe(perfil)
  })
  it('perfil ausente, inválido ou storage indisponível não concede perfil', () => {
    expect(lerPerfil()).toBeNull()
    localStorage.setItem('perfil', 'auditor')
    expect(lerPerfil()).toBeNull()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(lerPerfil()).toBeNull()
  })
  it('atualiza o estado após login e logout', () => {
    const perfil = usePerfil()
    localStorage.setItem('perfil', 'AUDITOR')
    atualizarPerfil()
    expect(perfil.ehAuditor.value).toBe(true)
    expect(perfil.ehSupervisor.value).toBe(false)
    localStorage.removeItem('perfil')
    atualizarPerfil()
    expect(perfil.perfil.value).toBeNull()
    expect(perfil.ehAuditor.value).toBe(false)
  })
  it.each([
    ['SUPERVISOR', true],
    ['AUDITOR', true],
    ['GERENTE', false],
    ['ADMIN', false],
  ] as const)('SQL e código gerado: %s vê = %s (US-20)', (valor, esperado) => {
    localStorage.setItem('perfil', valor)
    expect(usePerfil().podeVerCodigoGerado.value).toBe(esperado)
  })
  it('destino inicial respeita o perfil', () => {
    expect(rotaInicial('AUDITOR')).toBe('auditoria')
    expect(rotaInicial('ADMIN')).toBe('users')
    expect(rotaInicial('GERENTE')).toBe('chat')
    expect(rotaInicial('SUPERVISOR')).toBe('chat')
  })
})
