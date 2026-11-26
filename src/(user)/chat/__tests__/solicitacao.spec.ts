import { describe, expect, it, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import {
  acharRascunhoPendente,
  aplicarErroSolicitacao,
  aplicarSucessoSolicitacao,
  atualizarMotivoSolicitacao,
  cancelarSolicitacaoCorrecao,
  criarSolicitacaoRascunho,
  executarEnvioSolicitacao,
  limparEstadoLocal,
  montarPayloadCorrecao,
} from '../solicitacao'
import type { MensagemChat, SolicitacaoCorrecaoChat } from '../types'

describe('módulo solicitacao.ts', () => {
  it('limparEstadoLocal extrai apenas campos do contrato e remove estado local', () => {
    const comEstado: SolicitacaoCorrecaoChat = {
      categoria: 'CORRECAO',
      tipo: 'TRANSFERENCIA_LOJA',
      tipo_rotulo: 'Transferência de loja',
      matricula: 'MATRIC-38',
      competencia: '2025-10',
      antes: '33',
      depois: '8',
      antes_rotulo: 'Loja 33',
      depois_rotulo: 'Loja 8',
      motivo: 'Motivo teste',
      id: 99,
      status: 'rascunho',
      statusEnvio: 'pendente',
      erroEnvio: null,
      enviada: false,
    }

    const limpo = limparEstadoLocal(comEstado)
    expect(limpo).toEqual({
      categoria: 'CORRECAO',
      tipo: 'TRANSFERENCIA_LOJA',
      tipo_rotulo: 'Transferência de loja',
      matricula: 'MATRIC-38',
      competencia: '2025-10',
      antes: '33',
      depois: '8',
      antes_rotulo: 'Loja 33',
      depois_rotulo: 'Loja 8',
      motivo: 'Motivo teste',
    })
    expect('id' in limpo).toBe(false)
    expect('status' in limpo).toBe(false)
    expect('statusEnvio' in limpo).toBe(false)
  })

  it('acharRascunhoPendente retorna o último rascunho ainda não enviado', () => {
    const mensagens: MensagemChat[] = [
      {
        id: 1,
        chave: 'm-1',
        papel: 'agente',
        texto: 'Primeiro pedido já enviado',
        solicitacao: {
          categoria: 'CORRECAO',
          tipo: 'TROCA_CARGO',
          competencia: '2025-09',
          motivo: 'Primeiro',
          enviada: true,
          status: 'enviada',
          statusEnvio: 'sucesso',
        },
      },
      {
        id: 2,
        chave: 'm-2',
        papel: 'agente',
        texto: 'Segundo pedido em rascunho',
        solicitacao: {
          categoria: 'INTERCORRENCIA',
          tipo: 'FERIAS',
          matricula: 'MAT-12',
          competencia: '2025-12',
          depois: { data_inicio: '2025-12-01', data_fim: '2025-12-15' },
          motivo: 'Segundo',
          status: 'rascunho',
          statusEnvio: 'pendente',
        },
      },
    ]

    const rascunho = acharRascunhoPendente(mensagens)
    expect(rascunho).toBeDefined()
    expect(rascunho?.categoria).toBe('INTERCORRENCIA')
    expect(rascunho?.tipo).toBe('FERIAS')
    expect(rascunho?.motivo).toBe('Segundo')
  })

  it('acharRascunhoPendente retorna null se todos foram enviados ou não há solicitação', () => {
    const mensagens: MensagemChat[] = [
      {
        id: 1,
        chave: 'm-1',
        papel: 'agente',
        texto: 'Já enviado',
        solicitacao: {
          categoria: 'CORRECAO',
          tipo: 'TRANSFERENCIA_LOJA',
          competencia: '2025-10',
          motivo: 'Enviado',
          enviada: true,
        },
      },
      {
        id: 2,
        chave: 'm-2',
        papel: 'usuario',
        texto: 'Olá',
      },
    ]

    expect(acharRascunhoPendente(mensagens)).toBeNull()
  })

  it('criarSolicitacaoRascunho inicializa rascunho ou retorna null', () => {
    expect(criarSolicitacaoRascunho(null)).toBeNull()
    expect(criarSolicitacaoRascunho(undefined)).toBeNull()

    const sol = criarSolicitacaoRascunho({
      categoria: 'CORRECAO',
      tipo: 'TRANSFERENCIA_LOJA',
      competencia: '2025-10',
      motivo: 'Teste',
    })
    expect(sol).toEqual({
      categoria: 'CORRECAO',
      tipo: 'TRANSFERENCIA_LOJA',
      competencia: '2025-10',
      motivo: 'Teste',
      status: 'rascunho',
    })
  })

  it('cancelarSolicitacaoCorrecao e atualizarMotivoSolicitacao modificam a mensagem', () => {
    const msg: MensagemChat = {
      id: 1,
      chave: 'm-1',
      papel: 'agente',
      texto: 'Teste',
      solicitacao: {
        categoria: 'CORRECAO',
        tipo: 'TRANSFERENCIA_LOJA',
        competencia: '2025-10',
        motivo: 'Inicial',
      },
    }

    atualizarMotivoSolicitacao(msg, 'Atualizado')
    expect(msg.solicitacao?.motivo).toBe('Atualizado')

    cancelarSolicitacaoCorrecao(msg)
    expect(msg.solicitacao).toBeNull()
  })

  it('montarPayloadCorrecao gera os campos aceitos pelo backend', () => {
    const sol: SolicitacaoCorrecaoChat = {
      categoria: 'CORRECAO',
      tipo: 'TRANSFERENCIA_LOJA',
      tipo_rotulo: 'Transferência de loja',
      matricula: 'MATRIC-38',
      competencia: '2025-10',
      antes: '33',
      depois: '8',
      motivo: 'Antigo',
    }

    const payload = montarPayloadCorrecao(sol, 'Novo motivo')
    expect(payload).toEqual({
      tipo: 'TRANSFERENCIA_LOJA',
      matricula: 'MATRIC-38',
      competencia: '2025-10',
      antes: '33',
      depois: '8',
      motivo: 'Novo motivo',
    })
  })

  it('aplicarSucessoSolicitacao e aplicarErroSolicitacao alteram o estado local', () => {
    const sol: SolicitacaoCorrecaoChat = {
      categoria: 'CORRECAO',
      tipo: 'TRANSFERENCIA_LOJA',
      competencia: '2025-10',
      motivo: 'Teste',
    }

    aplicarSucessoSolicitacao(sol, { id: 88, status: 'PENDENTE' })
    expect(sol.id).toBe(88)
    expect(sol.status).toBe('PENDENTE')
    expect(sol.enviada).toBe(true)
    expect(sol.statusEnvio).toBe('sucesso')
    expect(sol.erroEnvio).toBeNull()

    const falha = aplicarErroSolicitacao(sol, {
      response: { data: { message: 'Erro de validação' } },
    })
    expect(falha).toBe('Erro de validação')
    expect(sol.statusEnvio).toBe('erro')
    expect(sol.status).toBe('erro')
    expect(sol.erroEnvio).toBe('Erro de validação')
  })

  it('executarEnvioSolicitacao envia via API e notifica em sucesso', async () => {
    const postMock = vi.fn().mockResolvedValue({ data: { id: 10, status: 'PENDENTE' } })
    const fakeClient = { post: postMock } as unknown as AxiosInstance
    const notificacoes: Array<{ papel: string; texto: string }> = []

    const msg: MensagemChat = {
      id: 1,
      chave: 'm-1',
      papel: 'agente',
      texto: 'Teste',
      solicitacao: {
        categoria: 'CORRECAO',
        tipo: 'TRANSFERENCIA_LOJA',
        competencia: '2025-10',
        antes: '1',
        depois: '2',
        motivo: 'Inicial',
      },
    }

    await executarEnvioSolicitacao(fakeClient, 'chat-123', msg, 'Motivo final', (papel, texto) => {
      notificacoes.push({ papel, texto })
    })

    expect(postMock).toHaveBeenCalledWith('/api/chat/chat-123/correcoes', {
      tipo: 'TRANSFERENCIA_LOJA',
      matricula: undefined,
      competencia: '2025-10',
      antes: '1',
      depois: '2',
      motivo: 'Motivo final',
    })
    expect(msg.solicitacao?.id).toBe(10)
    expect(msg.solicitacao?.enviada).toBe(true)
    expect(notificacoes).toEqual([
      { papel: 'sistema', texto: 'Abri o pedido; ele vale depois que um Supervisor aprovar' },
    ])
  })

  it('executarEnvioSolicitacao notifica erro se post falhar', async () => {
    const postMock = vi.fn().mockRejectedValue({ response: { data: { message: 'Sem permissão' } } })
    const fakeClient = { post: postMock } as unknown as AxiosInstance
    const notificacoes: Array<{ papel: string; texto: string }> = []

    const msg: MensagemChat = {
      id: 1,
      chave: 'm-1',
      papel: 'agente',
      texto: 'Teste',
      solicitacao: {
        categoria: 'CORRECAO',
        tipo: 'TRANSFERENCIA_LOJA',
        competencia: '2025-10',
        motivo: 'Inicial',
      },
    }

    await executarEnvioSolicitacao(fakeClient, 'chat-123', msg, 'Motivo', (papel, texto) => {
      notificacoes.push({ papel, texto })
    })

    expect(msg.solicitacao?.status).toBe('erro')
    expect(notificacoes).toEqual([
      { papel: 'erro', texto: 'Erro ao enviar solicitação: Sem permissão' },
    ])
  })
})
