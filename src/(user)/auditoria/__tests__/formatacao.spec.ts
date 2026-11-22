import { describe, expect, it } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import {
  diferencasEntreVersoes,
  erroAlerta,
  motivoBloqueioPasso,
  nomeUsuarioAlerta,
  passoBloqueado,
  passoComBloqueioOuErro,
  valorCorrecao,
} from '../formatacao'
import { regraBlackFriday } from '../../chat/__tests__/fakes'

describe('comparação de versões', () => {
  it('destaca somente parâmetros alterados, com valores formatados', () => {
    const diff = diferencasEntreVersoes(regraBlackFriday(), regraBlackFriday({ pct_acrescimo: 2 }))
    expect(diff).toHaveLength(1)
    expect(diff[0]).toMatchObject({ chave: 'pct_acrescimo', antes: '1%', depois: '2%' })
  })
  it('inclui parâmetros adicionados e removidos', () => {
    const a = regraBlackFriday(),
      b = regraBlackFriday()
    a.parametros = a.parametros.filter((p) => p.key !== 'meta_vendas')
    b.parametros = b.parametros.filter((p) => p.key !== 'orcamento_limite')
    const diff = diferencasEntreVersoes(a, b)
    expect(diff.find((d) => d.chave === 'meta_vendas')?.antes).toBe('Não informado')
    expect(diff.find((d) => d.chave === 'orcamento_limite')?.depois).toBe('Removido')
  })
  it('não confunde reordenação de seleção com mudança de regra', () => {
    expect(
      diferencasEntreVersoes(
        regraBlackFriday(),
        regraBlackFriday({ cargos_alvo: ['300', '100', '200'] }),
      ),
    ).toEqual([])
  })
  it('formata antes/depois escalar, nulo e objeto de RH', () => {
    expect(valorCorrecao(null)).toBe('Não informado')
    expect(valorCorrecao('8')).toBe('8')
    expect(valorCorrecao({ data_inicio: '2026-11-13', cod_loja: '8' })).toBe(
      'Início: 13/11/2026 · Loja: 8',
    )
  })
})

describe('helpers da aba técnica e alertas', () => {
  it('formata o nome do usuário de alerta para objeto, string ou nulo', () => {
    expect(nomeUsuarioAlerta({ id: 1, nome: 'Aline' })).toBe('Aline')
    expect(nomeUsuarioAlerta('Sistema')).toBe('Sistema')
    expect(nomeUsuarioAlerta(null)).toBe('Não informado')
    expect(nomeUsuarioAlerta({ id: 2, nome: null })).toBe('Não informado')
  })

  it('identifica passo bloqueado ou com erro e compõe o motivo', () => {
    expect(passoBloqueado({ situacao: 'BLOQUEADA' })).toBe(true)
    expect(passoBloqueado({ situacao: 'ERRO' })).toBe(false)
    expect(passoBloqueado({ situacao: 'SUCESSO' })).toBe(false)
    expect(passoComBloqueioOuErro({ situacao: 'SUCESSO', mensagem_erro: null })).toBe(false)
    expect(
      passoComBloqueioOuErro({ situacao: 'BLOQUEADA', mensagem_erro: 'Tabela não autorizada' }),
    ).toBe(true)
    expect(passoComBloqueioOuErro({ situacao: 'SUCESSO', mensagem_erro: 'Timeout' })).toBe(true)
    expect(
      motivoBloqueioPasso({ situacao: 'BLOQUEADA', mensagem_erro: 'Tabela não autorizada' }),
    ).toBe('BLOQUEADA: Tabela não autorizada')
  })

  it('extrai mensagens de erro de API (400, 403, 409, rede e ignora HTML/texto longo)', () => {
    const config = {} as InternalAxiosRequestConfig
    const erro409 = new AxiosError('Conflict', 'ERR_BAD_REQUEST', config, null, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config,
      data: { detail: 'Alerta já foi resolvido.' },
    })
    const erro403 = new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, null, {
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config,
      data: {},
    })
    const erro400 = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', config, null, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config,
      data: {},
    })
    const erro502Html = new AxiosError('Bad Gateway', 'ERR_BAD_RESPONSE', config, null, {
      status: 502,
      statusText: 'Bad Gateway',
      headers: {},
      config,
      data: '<html><body><h1>502 Bad Gateway</h1></body></html>',
    })
    const erroRede = new AxiosError('Network Error', 'ERR_NETWORK', config)

    expect(erroAlerta(erro409, 'resolver')).toBe('Alerta já foi resolvido.')
    expect(erroAlerta(erro403, 'abrir')).toBe('Apenas o Auditor pode executar esta ação.')
    expect(erroAlerta(erro400, 'abrir')).toBe('Dados inválidos para abrir o alerta.')
    expect(erroAlerta(erro502Html, 'abrir')).toBe(
      'Não foi possível abrir o alerta. Tente novamente.',
    )
    expect(erroAlerta(erroRede, 'abrir')).toBe('Erro de conexão com o servidor. Tente novamente.')
  })
})
