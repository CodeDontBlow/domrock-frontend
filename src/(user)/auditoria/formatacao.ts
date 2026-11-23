import { isAxiosError } from 'axios'
import type { UsuarioResumo } from '../campanha/types'
import { valorDoParametro, diaDaCampanha } from '../campanhas/formatacao'
import type { PassoTrilha, RegraCampanha, ValorParametro } from '../chat/types'

function compararValor(valor: ValorParametro | undefined): string {
  if (Array.isArray(valor)) return JSON.stringify([...valor].sort())
  if (valor && typeof valor === 'object') return JSON.stringify([valor.data_inicio, valor.data_fim])
  return JSON.stringify(valor) ?? ''
}

/** Compara por chave, incluindo parâmetros adicionados e removidos, sem recalcular valores. */
export function diferencasEntreVersoes(antes: RegraCampanha, depois: RegraCampanha) {
  const antigos = new Map(antes.parametros.map((p) => [p.key, p]))
  const novos = new Map(depois.parametros.map((p) => [p.key, p]))
  return [...new Set([...antigos.keys(), ...novos.keys()])].flatMap((key) => {
    const a = antigos.get(key)
    const b = novos.get(key)
    if (a && b && compararValor(a.value) === compararValor(b.value)) return []
    return [
      {
        chave: key,
        rotulo: b?.label ?? a?.label ?? key,
        antes: a ? valorDoParametro(a) : 'Não informado',
        depois: b ? valorDoParametro(b) : 'Removido',
      },
    ]
  })
}

const rotulos: Record<string, string> = {
  TRANSFERENCIA_LOJA: 'Transferência de loja',
  TROCA_CARGO: 'Troca de cargo',
  DATA_ADMISSAO: 'Data de admissão',
  DATA_DEMISSAO: 'Data de demissão',
  AFASTAMENTO: 'Afastamento',
  FERIAS: 'Férias',
  LICENCA_MATERNIDADE: 'Licença-maternidade',
  COBERTURA_LOJA: 'Cobertura de loja',
  DEMISSAO: 'Demissão',
  data_inicio: 'Início',
  data_fim: 'Fim',
  cod_loja: 'Loja',
}
export function rotuloCorrecao(tipo: string): string {
  return rotulos[tipo] ?? tipo
}

export function valorCorrecao(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return 'Não informado'
  if (Array.isArray(valor)) return valor.map(valorCorrecao).join(', ')
  if (typeof valor === 'object')
    return Object.entries(valor)
      .map(([k, v]) => `${rotuloCorrecao(k)}: ${valorCorrecao(v)}`)
      .join(' · ')
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return diaDaCampanha(valor)
  return String(valor)
}

export function erroConsulta(erro: unknown, assunto: string): string {
  if (isAxiosError(erro) && erro.response?.status === 403)
    return 'Seu perfil não permite esta consulta.'
  return `Não foi possível carregar ${assunto}. Tente novamente.`
}

export function nomeUsuarioAlerta(usuario: UsuarioResumo | string | null | undefined): string {
  if (!usuario) return 'Não informado'
  if (typeof usuario === 'string') return usuario.trim() || 'Não informado'
  return usuario.nome?.trim() || 'Não informado'
}

export function passoBloqueado(passo: Pick<PassoTrilha, 'situacao'>): boolean {
  return (passo.situacao ?? '').toUpperCase().includes('BLOQUEAD')
}

const TERMOS_ERRO_PASSO = ['erro', 'error', 'falha', 'negad', 'recusad', 'proibid']

export function passoComBloqueioOuErro(
  passo: Pick<PassoTrilha, 'situacao' | 'mensagem_erro'>,
): boolean {
  if (passoBloqueado(passo)) return true
  if (passo.mensagem_erro?.trim()) return true
  const situacao = (passo.situacao ?? '').toLowerCase()
  return TERMOS_ERRO_PASSO.some((termo) => situacao.includes(termo))
}

export function motivoBloqueioPasso(
  passo: Pick<PassoTrilha, 'situacao' | 'mensagem_erro'>,
): string {
  const erro = passo.mensagem_erro?.trim()
  const situacao = passo.situacao?.trim()
  if (erro && situacao && !erro.toLowerCase().includes(situacao.toLowerCase())) {
    return `${situacao}: ${erro}`
  }
  return erro || situacao || (passoBloqueado(passo) ? 'Consulta bloqueada' : 'Erro na consulta')
}

function mensagemDaResposta(data: unknown): string | null {
  if (typeof data === 'string') {
    const t = data.trim()
    if (!t || t.startsWith('<') || t.length > 300) return null
    return t
  }
  if (data && typeof data === 'object') {
    const registro = data as Record<string, unknown>
    for (const chave of ['detail', 'mensagem', 'message', 'erro']) {
      const valor = registro[chave]
      if (typeof valor === 'string' && valor.trim()) return valor.trim()
    }
  }
  return null
}

export function erroAlerta(erro: unknown, acao: 'abrir' | 'resolver'): string {
  const padrao =
    acao === 'abrir'
      ? 'Não foi possível abrir o alerta. Tente novamente.'
      : 'Não foi possível resolver o alerta. Tente novamente.'

  if (isAxiosError(erro)) {
    const detalhe = mensagemDaResposta(erro.response?.data)
    if (detalhe) return detalhe

    const status = erro.response?.status
    if (status === 400) {
      return acao === 'abrir'
        ? 'Dados inválidos para abrir o alerta.'
        : 'Dados inválidos para resolver o alerta.'
    }
    if (status === 403) return 'Apenas o Auditor pode executar esta ação.'
    if (status === 409) {
      return acao === 'abrir'
        ? 'Não foi possível abrir o alerta devido a um conflito de estado.'
        : 'Este alerta já foi resolvido ou não pode ser alterado.'
    }
    if (!erro.response) return 'Erro de conexão com o servidor. Tente novamente.'
    return padrao
  }
  if (erro instanceof Error && erro.message.trim()) return erro.message.trim()
  return padrao
}
