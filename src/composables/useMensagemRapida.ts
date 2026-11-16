import { ref } from 'vue'
import type { TipoMensagemRapida } from '@/components/MensagemRapida.vue'

export interface NotificacaoRapida {
  id: number
  mensagem: string
  tipo: TipoMensagemRapida
  titulo?: string
  duracaoMs?: number
}

const notificacoes = ref<NotificacaoRapida[]>([])
let proximoId = 1

export function useMensagemRapida() {
  function exibir(
    mensagem: string,
    tipo: TipoMensagemRapida = 'sucesso',
    opcoes: { titulo?: string; duracaoMs?: number } = {},
  ): number {
    const id = proximoId++
    const duracao = opcoes.duracaoMs ?? 4000

    const item: NotificacaoRapida = {
      id,
      mensagem,
      tipo,
      titulo: opcoes.titulo,
      duracaoMs: duracao,
    }

    notificacoes.value.push(item)

    if (duracao > 0) {
      setTimeout(() => {
        remover(id)
      }, duracao)
    }

    return id
  }

  function sucesso(mensagem: string, titulo?: string): number {
    return exibir(mensagem, 'sucesso', { titulo })
  }

  function sucessoParcial(mensagem: string, titulo?: string): number {
    return exibir(mensagem, 'sucesso_parcial', { titulo })
  }

  function aviso(mensagem: string, titulo?: string): number {
    return exibir(mensagem, 'aviso', { titulo })
  }

  function erro(mensagem: string, titulo?: string): number {
    return exibir(mensagem, 'erro', { titulo })
  }

  function remover(id: number): void {
    notificacoes.value = notificacoes.value.filter((n) => n.id !== id)
  }

  function limpar(): void {
    notificacoes.value = []
  }

  return {
    notificacoes,
    exibir,
    sucesso,
    sucessoParcial,
    aviso,
    erro,
    remover,
    limpar,
  }
}
