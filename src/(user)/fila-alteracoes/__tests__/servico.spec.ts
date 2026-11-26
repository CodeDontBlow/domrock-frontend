import { describe, expect, it } from 'vitest'
import type { AxiosInstance } from 'axios'
import { criarServicoCorrecoes } from '../services/correcoes'
import { criarSolicitacaoFake } from './fakes'

class FakeHttpClient {
  chamadasGet: string[] = []
  chamadasPost: Array<{ url: string; body: unknown }> = []
  respostasGet: Record<string, unknown> = {}
  respostasPost: Record<string, unknown> = {}

  async get<T>(url: string): Promise<{ data: T }> {
    this.chamadasGet.push(url)
    return { data: (this.respostasGet[url] ?? []) as T }
  }

  async post<T>(url: string, body: unknown): Promise<{ data: T }> {
    this.chamadasPost.push({ url, body })
    return { data: (this.respostasPost[url] ?? {}) as T }
  }
}

describe('Serviço de Correções (services/correcoes.ts)', () => {
  it('listarFila chama GET /api/correcoes/fila', async () => {
    const fakeHttp = new FakeHttpClient()
    const fakeItem = criarSolicitacaoFake({ id: 10 })
    fakeHttp.respostasGet['/api/correcoes/fila'] = [fakeItem]

    const servico = criarServicoCorrecoes(fakeHttp as unknown as AxiosInstance)
    const resultado = await servico.listarFila()

    expect(fakeHttp.chamadasGet).toEqual(['/api/correcoes/fila'])
    expect(resultado).toEqual([fakeItem])
  })

  it('listarMinhas chama GET /api/correcoes/minhas', async () => {
    const fakeHttp = new FakeHttpClient()
    const fakeItem = criarSolicitacaoFake({ id: 20 })
    fakeHttp.respostasGet['/api/correcoes/minhas'] = [fakeItem]

    const servico = criarServicoCorrecoes(fakeHttp as unknown as AxiosInstance)
    const resultado = await servico.listarMinhas()

    expect(fakeHttp.chamadasGet).toEqual(['/api/correcoes/minhas'])
    expect(resultado).toEqual([fakeItem])
  })

  it('decidir chama POST /api/correcoes/{id}/decidir com o corpo correto para aprovação', async () => {
    const fakeHttp = new FakeHttpClient()
    const aprovada = criarSolicitacaoFake({ id: 5, status: 'APROVADA' })
    fakeHttp.respostasPost['/api/correcoes/5/decidir'] = aprovada

    const servico = criarServicoCorrecoes(fakeHttp as unknown as AxiosInstance)
    const resultado = await servico.decidir(5, 'APROVAR')

    expect(fakeHttp.chamadasPost).toEqual([
      {
        url: '/api/correcoes/5/decidir',
        body: { decisao: 'APROVAR', justificativa: '' },
      },
    ])
    expect(resultado).toEqual(aprovada)
  })

  it('decidir chama POST /api/correcoes/{id}/decidir com o corpo correto para reprovação com justificativa', async () => {
    const fakeHttp = new FakeHttpClient()
    const reprovada = criarSolicitacaoFake({ id: 8, status: 'REPROVADA' })
    fakeHttp.respostasPost['/api/correcoes/8/decidir'] = reprovada

    const servico = criarServicoCorrecoes(fakeHttp as unknown as AxiosInstance)
    const resultado = await servico.decidir(8, 'REPROVAR', 'Matrícula não pertence mais à loja')

    expect(fakeHttp.chamadasPost).toEqual([
      {
        url: '/api/correcoes/8/decidir',
        body: { decisao: 'REPROVAR', justificativa: 'Matrícula não pertence mais à loja' },
      },
    ])
    expect(resultado).toEqual(reprovada)
  })

  it('Supervisor chama /fila e /minhas, enquanto Gerente chama apenas /minhas', async () => {
    const fakeHttpSupervisor = new FakeHttpClient()
    const servicoSupervisor = criarServicoCorrecoes(fakeHttpSupervisor as unknown as AxiosInstance)

    // Simulação do carregamento de Supervisor
    const promessasSupervisor = [servicoSupervisor.listarMinhas(), servicoSupervisor.listarFila()]
    await Promise.all(promessasSupervisor)

    expect(fakeHttpSupervisor.chamadasGet).toContain('/api/correcoes/fila')
    expect(fakeHttpSupervisor.chamadasGet).toContain('/api/correcoes/minhas')

    const fakeHttpGerente = new FakeHttpClient()
    const servicoGerente = criarServicoCorrecoes(fakeHttpGerente as unknown as AxiosInstance)

    // Simulação do carregamento de Gerente (não chama /fila)
    const promessasGerente = [servicoGerente.listarMinhas()]
    await Promise.all(promessasGerente)

    expect(fakeHttpGerente.chamadasGet).toEqual(['/api/correcoes/minhas'])
    expect(fakeHttpGerente.chamadasGet).not.toContain('/api/correcoes/fila')
  })
})
