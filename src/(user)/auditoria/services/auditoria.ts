import type { AxiosInstance } from 'axios'
import { api } from '@/services/api'
import { criarServicoCampanhas } from '../../campanha/services/campanhas'
import type { ConversaGravada } from '../../chat/types'
import type { AlertaTecnico, CampanhaAuditoria, CorrecaoAuditoria } from '../types'

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
    async listarAlertas(campanhaId: number, numeroVersao: number): Promise<AlertaTecnico[]> {
      const { data } = await http.get<AlertaTecnico[]>(
        `/api/campanhas/${campanhaId}/versoes/${numeroVersao}/alertas`,
      )
      return data
    },
    async abrirAlerta(
      campanhaId: number,
      numeroVersao: number,
      descricao: string,
    ): Promise<AlertaTecnico> {
      const { data } = await http.post<AlertaTecnico>(
        `/api/campanhas/${campanhaId}/versoes/${numeroVersao}/alertas`,
        { descricao },
      )
      return data
    },
    async resolverAlerta(
      campanhaId: number,
      numeroVersao: number,
      alertaId: number,
      justificativa: string,
    ): Promise<AlertaTecnico> {
      const { data } = await http.post<AlertaTecnico>(
        `/api/campanhas/${campanhaId}/versoes/${numeroVersao}/alertas/${alertaId}/resolver`,
        { justificativa },
      )
      return data
    },
  }
}

export function obterServicoAuditoria() {
  return criarServicoAuditoria(api)
}
