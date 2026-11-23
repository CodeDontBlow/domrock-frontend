import type {
  AlertaTecnico,
  CampanhaResumo,
  OrigemAlerta,
  StatusAlerta,
  UsuarioResumo,
} from '../campanha/types'

export type { AlertaTecnico, OrigemAlerta, StatusAlerta }

/** Resumo de auditoria com autor; opcional para tolerar versões anteriores da API. */
export interface CampanhaAuditoria extends CampanhaResumo {
  autor?: UsuarioResumo | null
}

/** Envelope de SolicitacaoDetalheResponse retornado pela listagem de auditoria. */
export interface CorrecaoAuditoria {
  id: number
  tipo: string
  matricula: string
  competencia: string
  antes: unknown
  depois: unknown
  motivo: string | null
  status: 'PENDENTE' | 'APROVADA' | 'REPROVADA'
  autor: UsuarioResumo
  criada_em: string
  decisao: {
    decisao: string
    por: UsuarioResumo
    em: string
    justificativa: string | null
  } | null
}
