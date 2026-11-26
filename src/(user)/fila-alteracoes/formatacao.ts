export const ROTULOS_TIPO: Record<string, string> = {
  TRANSFERENCIA_LOJA: 'Transferência de loja',
  TROCA_CARGO: 'Troca de cargo',
  DATA_ADMISSAO: 'Data de admissão',
  DATA_DEMISSAO: 'Data de demissão',
  FERIAS: 'Férias',
  AFASTAMENTO: 'Afastamento',
  LICENCA_MATERNIDADE: 'Licença-maternidade',
  COBERTURA_LOJA: 'Cobertura de loja',
  DEMISSAO: 'Demissão',
}

export const TIPOS_INTERCORRENCIA = [
  'FERIAS',
  'AFASTAMENTO',
  'LICENCA_MATERNIDADE',
  'COBERTURA_LOJA',
  'DEMISSAO',
] as const

export function ehIntercorrencia(tipo: string): boolean {
  return TIPOS_INTERCORRENCIA.includes(tipo as (typeof TIPOS_INTERCORRENCIA)[number])
}

export function rotuloTipo(tipo: string): string {
  return ROTULOS_TIPO[tipo] || tipo
}

export function formatarData(dataStr?: string | null): string {
  if (!dataStr) return ''
  // Já em dd/mm/aaaa: o Date leria como mm/dd e trocaria dia e mês.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) return dataStr
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    const [ano, mes, dia] = dataStr.split('-')
    return `${dia}/${mes}/${ano}`
  }
  try {
    const d = new Date(dataStr)
    if (Number.isNaN(d.getTime())) return dataStr
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dataStr
  }
}

export interface PeriodoFormatado {
  inicio: string
  fim: string
  texto: string
}

export function formatarPeriodoIntercorrencia(tipo: string, depois: unknown): PeriodoFormatado {
  if (typeof depois === 'object' && depois !== null) {
    const d = depois as { data_inicio?: string; data_fim?: string; cod_loja?: string }
    const inicio = d.data_inicio ? formatarData(d.data_inicio) : ''
    const fim = d.data_fim ? formatarData(d.data_fim) : ''
    let texto = ''
    if (tipo === 'DEMISSAO') {
      texto = inicio ? `A partir de ${inicio}` : ''
    } else if (inicio && fim) {
      texto = `${inicio} a ${fim}`
    } else {
      texto = inicio || fim || ''
    }
    if (tipo === 'COBERTURA_LOJA' && d.cod_loja) {
      texto = texto ? `${texto} (Loja ${d.cod_loja})` : `Loja ${d.cod_loja}`
    }
    return { inicio, fim, texto }
  }
  const str = typeof depois === 'string' ? depois : ''
  return { inicio: '', fim: '', texto: str }
}

export function formatarSolicitante(origem?: string, autorNome?: string): string {
  const nome = autorNome || 'Usuário'
  if (origem === 'LANA') {
    return `Aberta pela Lana a pedido de ${nome}`
  }
  return `Solicitado por ${nome}`
}

export function rotuloStatus(status: string): string {
  switch (status) {
    case 'PENDENTE':
      return 'Pendente'
    case 'APROVADA':
    case 'Aprovado':
      return 'Aprovado'
    case 'REPROVADA':
    case 'Reprovado':
      return 'Reprovado'
    default:
      return status
  }
}

export function extrairMensagemErroDecisao(erro: unknown): string {
  const err = erro as { response?: { status?: number; data?: { message?: string } } }
  const message = err?.response?.data?.message
  if (message) return message
  const status = err?.response?.status
  if (status === 409) return 'A base mudou desde o pedido'
  if (status === 403) return 'Outra pessoa precisa aprovar esta correção'
  return 'Ocorreu um erro ao registrar a decisão'
}
