import type { SolicitacaoDetalheResponse } from './services/correcoes'

export type { SolicitacaoDetalheResponse }

export type VisualizacaoFila = 'correcao' | 'intercorrencia'

export type StatusSolicitacao =
  'PENDENTE' | 'APROVADA' | 'REPROVADA' | 'Aprovado' | 'Arquivado' | 'Reprovado' | 'Pendente'

/**
 * Item de solicitação de correção de base exibido nos cards da fila superior.
 */
export interface SolicitacaoBaseCard {
  id: number | string
  tipo: string
  competencia: string
  matriculasCount?: number
  matriculas?: string[]
  matricula?: string
  motivo: string
  valorAnterior?: string
  valorAposMudanca?: string
  antes?: unknown
  depois?: unknown
  origem?: string
  autor?: { id: number | string; nome: string }
  solicitante?: string
  submetidoEm?: string
  criada_em?: string
  status: StatusSolicitacao
}

/**
 * Item de solicitação de abertura de intercorrência exibido nos cards da fila superior.
 */
export interface SolicitacaoIntercorrenciaCard {
  id: number | string
  tipo: string
  matriculasCount?: number
  matriculas?: string[]
  matricula?: string
  duracao?: string
  impacto?: string
  inicio?: string
  fim?: string
  depois?: unknown
  motivo: string
  origem?: string
  autor?: { id: number | string; nome: string }
  solicitante?: string
  submetidoEm?: string
  criada_em?: string
  status: StatusSolicitacao
}

export interface ItemTabelaHistorico {
  id: string | number
  motivo: string
  tipo: string
  competencia?: string
  periodo?: string
  matriculas: string
  status: string
  justificativa?: string | null
}
