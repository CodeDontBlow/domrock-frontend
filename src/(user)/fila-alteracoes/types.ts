export type VisualizacaoFila = 'correcao' | 'intercorrencia'

export type StatusSolicitacao = 'PENDENTE' | 'Aprovado' | 'Arquivado'

/**
 * Item de solicitação de correção de base exibido nos cards da fila superior.
 * Baseado no componente solicitacao-base-card do Figma (984:3544).
 */
export interface SolicitacaoBaseCard {
  id: number | string
  tipo: string
  competencia: string
  matriculasCount: number
  matriculas: string[]
  motivo: string
  valorAnterior: string
  valorAposMudanca: string
  solicitante: string
  submetidoEm: string
  status: StatusSolicitacao
}

/**
 * Item de solicitação de abertura de intercorrência exibido nos cards da fila superior.
 * Baseado no componente solicitacao-intercorrencia-card do Figma (996:4945).
 */
export interface SolicitacaoIntercorrenciaCard {
  id: number | string
  tipo: string
  matriculasCount: number
  matriculas: string[]
  impacto?: string
  inicio: string
  fim: string
  motivo: string
  solicitante: string
  submetidoEm: string
  status: StatusSolicitacao
}

/**
 * Linha da tabela de Histórico de Solicitações para Correção da Base.
 */
export interface HistoricoCorrecaoLinha {
  id: number | string
  motivo: string
  tipo: string
  competencia: string
  matriculas: string
  status: 'Aprovado' | 'Arquivado'
}

/**
 * Linha da tabela de Histórico de Solicitações para Abertura de Intercorrência.
 */
export interface HistoricoIntercorrenciaLinha {
  id: number | string
  motivo: string
  tipo: string
  periodo: string
  matriculas: string
  status: 'Aprovado' | 'Arquivado'
}
