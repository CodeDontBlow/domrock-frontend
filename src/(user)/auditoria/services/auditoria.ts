import type { AxiosInstance } from 'axios'
import { api } from '@/services/api'
import { criarServicoCampanhas } from '../../campanha/services/campanhas'
import type { ConversaGravada } from '../../chat/types'
import type { CampanhaAuditoria, CorrecaoAuditoria } from '../types'

/** Somente consultas. O frontend não altera campanhas nem o estado do chat nesta tela. */
export function criarServicoAuditoria(http: AxiosInstance) {
  const campanhas = criarServicoCampanhas(http)
  return {
    async listar(): Promise<CampanhaAuditoria[]> {
      const { data } = await http.get<CampanhaAuditoria[]>('/api/campanhas/auditoria')
      return data
    },
    abrir: campanhas.abrir,
    versao: campanhas.versao,
    async conversa(chatId: string): Promise<ConversaGravada> {
      const { data } = await http.get<ConversaGravada>(
        `/api/chat/${encodeURIComponent(chatId)}/mensagens`,
      )
      return data
    },
    // Listagem global exclusiva do Auditor, documentada em docs/auditoria.md.
    async correcoes(): Promise<CorrecaoAuditoria[]> {
      const { data } = await http.get<CorrecaoAuditoria[]>('/api/correcoes/auditoria')
      return data
    },
  }
}

export function obterServicoAuditoria() {
  return criarServicoAuditoria(api)
}
