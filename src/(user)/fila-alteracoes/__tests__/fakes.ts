import type { DecisaoTipo, SolicitacaoDetalheResponse } from '../services/correcoes'

export function criarSolicitacaoFake(
  sobrescrever: Partial<SolicitacaoDetalheResponse> = {},
): SolicitacaoDetalheResponse {
  return {
    id: 1,
    tipo: 'TRANSFERENCIA_LOJA',
    matricula: 'MATRIC-38',
    competencia: '2025-10',
    antes: '33',
    depois: '8',
    motivo: 'Transferência de loja',
    origem: 'LANA',
    chat_id: 'chat-1',
    status: 'PENDENTE',
    autor: { id: 10, nome: 'Roberval Silva' },
    criada_em: '2026-11-20T10:00:00Z',
    decisao: null,
    descricao_origem: 'Criado pela Lana',
    ...sobrescrever,
  }
}

export function criarIntercorrenciaFake(
  sobrescrever: Partial<SolicitacaoDetalheResponse> = {},
): SolicitacaoDetalheResponse {
  return {
    id: 2,
    tipo: 'FERIAS',
    matricula: 'MATRIC-12',
    competencia: '2025-12',
    antes: null,
    depois: { data_inicio: '2025-12-01', data_fim: '2025-12-15' },
    motivo: 'Férias programadas',
    origem: 'USUARIO',
    chat_id: null,
    status: 'PENDENTE',
    autor: { id: 11, nome: 'Ana Costa' },
    criada_em: '2026-11-21T14:30:00Z',
    decisao: null,
    descricao_origem: null,
    ...sobrescrever,
  }
}

export class FakeServicoCorrecoes {
  fila: SolicitacaoDetalheResponse[] = []
  minhas: SolicitacaoDetalheResponse[] = []
  decisoes: Array<{ id: number | string; decisao: DecisaoTipo; justificativa?: string | null }> = []
  falha: unknown = null
  falhaDecidir: unknown = null

  async listarFila(): Promise<SolicitacaoDetalheResponse[]> {
    if (this.falha) throw this.falha
    return [...this.fila]
  }

  async listarMinhas(): Promise<SolicitacaoDetalheResponse[]> {
    if (this.falha) throw this.falha
    return [...this.minhas]
  }

  async decidir(
    id: number | string,
    decisao: DecisaoTipo,
    justificativa?: string | null,
  ): Promise<SolicitacaoDetalheResponse> {
    if (this.falhaDecidir) throw this.falhaDecidir
    if (this.falha) throw this.falha
    this.decisoes.push({ id, decisao, justificativa })
    return criarSolicitacaoFake({
      id: Number(id),
      status: decisao === 'APROVAR' ? 'APROVADA' : 'REPROVADA',
    })
  }
}
