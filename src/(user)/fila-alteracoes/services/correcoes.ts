import type { AxiosInstance } from 'axios'
import { api } from '@/services/api'

export type DecisaoTipo = 'APROVAR' | 'REPROVAR'
export type StatusSolicitacaoBackend = 'PENDENTE' | 'APROVADA' | 'REPROVADA'

export interface AutorSolicitacao {
  id: number | string
  nome: string
}

export interface DecisaoSolicitacao {
  decisao: string
  por: AutorSolicitacao
  em: string
  justificativa?: string | null
}

export interface SolicitacaoDetalheResponse {
  id: number
  tipo: string
  matricula: string
  competencia: string
  antes: unknown
  depois: unknown
  motivo: string
  origem: 'LANA' | 'USUARIO' | string
  chat_id?: string | null
  status: StatusSolicitacaoBackend
  autor: AutorSolicitacao
  criada_em: string
  decisao?: DecisaoSolicitacao | null
  descricao_origem?: string | null
}

export interface DecidirPayload {
  decisao: DecisaoTipo
  justificativa?: string | null
}

export function criarServicoCorrecoes(http: AxiosInstance = api) {
  return {
    async listarFila(): Promise<SolicitacaoDetalheResponse[]> {
      const { data } = await http.get<SolicitacaoDetalheResponse[]>('/api/correcoes/fila')
      return data
    },

    async listarMinhas(): Promise<SolicitacaoDetalheResponse[]> {
      const { data } = await http.get<SolicitacaoDetalheResponse[]>('/api/correcoes/minhas')
      return data
    },

    async decidir(
      id: number | string,
      decisao: DecisaoTipo,
      justificativa?: string | null,
    ): Promise<SolicitacaoDetalheResponse> {
      const { data } = await http.post<SolicitacaoDetalheResponse>(`/api/correcoes/${id}/decidir`, {
        decisao,
        justificativa: justificativa ?? '',
      })
      return data
    },
  }
}

let servicoAtual = criarServicoCorrecoes(api)

export function definirServicoCorrecoes(
  novoServico: ReturnType<typeof criarServicoCorrecoes>,
): void {
  servicoAtual = novoServico
}

export async function listarFila(http?: AxiosInstance): Promise<SolicitacaoDetalheResponse[]> {
  if (http) return criarServicoCorrecoes(http).listarFila()
  return servicoAtual.listarFila()
}

export async function listarMinhas(http?: AxiosInstance): Promise<SolicitacaoDetalheResponse[]> {
  if (http) return criarServicoCorrecoes(http).listarMinhas()
  return servicoAtual.listarMinhas()
}

export async function decidir(
  id: number | string,
  decisao: DecisaoTipo,
  justificativa?: string | null,
  http?: AxiosInstance,
): Promise<SolicitacaoDetalheResponse> {
  if (http) return criarServicoCorrecoes(http).decidir(id, decisao, justificativa)
  return servicoAtual.decidir(id, decisao, justificativa)
}
