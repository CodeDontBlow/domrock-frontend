import type { AxiosInstance } from 'axios'
import { descreverFalha } from './services/campanha'
import type { MensagemChat, PapelMensagem, Solicitacao, SolicitacaoCorrecaoChat } from './types'

export interface PayloadCorrecaoChat {
  tipo: string
  matricula?: string
  competencia: string
  antes?: string | null
  depois?: unknown
  motivo: string
}

export interface RespostaConfirmacaoCorrecao {
  id?: number | string
  status?: string
}

export type NotificadorMensagem = (papel: PapelMensagem, texto: string) => void

/**
 * Remove o estado local da solicitação para enviar apenas campos do contrato.
 *
 * @example
 * const limpo = limparEstadoLocal(solicitacaoComEstado)
 */
export function limparEstadoLocal(solicitacao: SolicitacaoCorrecaoChat): Solicitacao {
  const {
    categoria,
    tipo,
    tipo_rotulo,
    matricula,
    competencia,
    antes,
    depois,
    antes_rotulo,
    depois_rotulo,
    motivo,
  } = solicitacao
  return {
    categoria,
    tipo,
    tipo_rotulo,
    matricula,
    competencia,
    antes,
    depois,
    antes_rotulo,
    depois_rotulo,
    motivo,
  }
}

/**
 * Encontra o rascunho pendente mais recente na lista de mensagens do chat.
 *
 * @example
 * const rascunho = acharRascunhoPendente(chat.mensagens)
 */
export function acharRascunhoPendente(mensagensLista: MensagemChat[]): Solicitacao | null {
  for (let i = mensagensLista.length - 1; i >= 0; i--) {
    const s = mensagensLista[i]?.solicitacao
    if (s && s.status !== 'enviada' && s.statusEnvio !== 'sucesso' && !s.enviada) {
      return limparEstadoLocal(s)
    }
  }
  return null
}

/**
 * Inicializa uma solicitação vinda da Lana com o estado local de rascunho.
 *
 * @example
 * const rascunho = criarSolicitacaoRascunho(resposta.solicitacao)
 */
export function criarSolicitacaoRascunho(
  solicitacao: Solicitacao | null | undefined,
): SolicitacaoCorrecaoChat | null {
  if (!solicitacao) return null
  return { ...solicitacao, status: 'rascunho' }
}

/**
 * Cancela e descarta a solicitação vinculada à mensagem.
 *
 * @example
 * cancelarSolicitacaoCorrecao(mensagem)
 */
export function cancelarSolicitacaoCorrecao(mensagem: MensagemChat): void {
  mensagem.solicitacao = null
}

/**
 * Altera o motivo de uma solicitação em rascunho.
 *
 * @example
 * atualizarMotivoSolicitacao(mensagem, 'Novo motivo informado')
 */
export function atualizarMotivoSolicitacao(mensagem: MensagemChat, novoMotivo: string): void {
  if (mensagem.solicitacao) {
    mensagem.solicitacao.motivo = novoMotivo
  }
}

/**
 * Monta o payload exato aceito pelo endpoint POST /api/chat/{chat_id}/correcoes.
 *
 * @example
 * const payload = montarPayloadCorrecao(mensagem.solicitacao, 'Motivo')
 */
export function montarPayloadCorrecao(
  solicitacao: SolicitacaoCorrecaoChat,
  motivo: string,
): PayloadCorrecaoChat {
  return {
    tipo: solicitacao.tipo,
    matricula: solicitacao.matricula,
    competencia: solicitacao.competencia,
    antes: solicitacao.antes,
    depois: solicitacao.depois,
    motivo,
  }
}

/**
 * Atualiza o estado da solicitação após confirmação com sucesso na API.
 *
 * @example
 * aplicarSucessoSolicitacao(solicitacao, { id: 12, status: 'PENDENTE' })
 */
export function aplicarSucessoSolicitacao(
  solicitacao: SolicitacaoCorrecaoChat,
  resposta: RespostaConfirmacaoCorrecao,
): void {
  if (resposta?.id) solicitacao.id = resposta.id
  if (resposta?.status) solicitacao.status = resposta.status
  else solicitacao.status = 'enviada'
  solicitacao.enviada = true
  solicitacao.statusEnvio = 'sucesso'
  solicitacao.erroEnvio = null
}

/**
 * Atualiza o estado da solicitação após falha ao tentar confirmar na API.
 *
 * @example
 * const mensagemErro = aplicarErroSolicitacao(solicitacao, erro)
 */
export function aplicarErroSolicitacao(
  solicitacao: SolicitacaoCorrecaoChat,
  erro: unknown,
): string {
  solicitacao.statusEnvio = 'erro'
  solicitacao.status = 'erro'
  const falha =
    (erro as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    descreverFalha(erro)
  solicitacao.erroEnvio = falha
  return falha
}

/**
 * Executa o envio e confirmação do pedido de correção/intercorrência via API.
 *
 * @example
 * await executarEnvioSolicitacao(api, chatId, mensagem, motivo, notificador)
 */
export async function executarEnvioSolicitacao(
  cliente: AxiosInstance,
  chatId: string,
  mensagem: MensagemChat,
  motivo: string,
  notificar: NotificadorMensagem,
): Promise<void> {
  if (!mensagem.solicitacao) return
  mensagem.solicitacao.motivo = motivo
  mensagem.solicitacao.statusEnvio = 'enviando'

  try {
    const payload = montarPayloadCorrecao(mensagem.solicitacao, motivo)
    const { data } = await cliente.post<RespostaConfirmacaoCorrecao>(
      `/api/chat/${chatId}/correcoes`,
      payload,
    )
    aplicarSucessoSolicitacao(mensagem.solicitacao, data)
    notificar('sistema', 'Abri o pedido; ele vale depois que um Supervisor aprovar')
  } catch (erro: unknown) {
    const falha = aplicarErroSolicitacao(mensagem.solicitacao, erro)
    notificar('erro', `Erro ao enviar solicitação: ${falha}`)
  }
}
