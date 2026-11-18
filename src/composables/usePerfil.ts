import { computed, ref } from 'vue'

export type Perfil = 'GERENTE' | 'SUPERVISOR' | 'ADMIN' | 'AUDITOR'
const perfis: readonly string[] = ['GERENTE', 'SUPERVISOR', 'ADMIN', 'AUDITOR']

/** A API continua sendo responsável pela autorização; o perfil local orienta a interface. */
export function lerPerfil(): Perfil | null {
  try {
    const valor = localStorage.getItem('perfil')
    return valor && perfis.includes(valor) ? (valor as Perfil) : null
  } catch {
    return null
  }
}

const perfil = ref<Perfil | null>(null)

export function atualizarPerfil(): void {
  perfil.value = lerPerfil()
}

export function rotaInicial(perfilAtual: Perfil | null = lerPerfil()): string {
  if (perfilAtual === 'AUDITOR') return 'auditoria'
  if (perfilAtual === 'ADMIN') return 'users'
  return 'chat'
}

export function usePerfil() {
  atualizarPerfil()
  return {
    perfil: computed(() => perfil.value),
    ehAuditor: computed(() => perfil.value === 'AUDITOR'),
    ehSupervisor: computed(() => perfil.value === 'SUPERVISOR'),
  }
}
