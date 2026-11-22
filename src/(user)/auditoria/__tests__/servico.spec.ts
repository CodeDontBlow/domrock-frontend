import { describe, expect, it, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { criarServicoAuditoria } from '../services/auditoria'

describe('contrato de consultas da Auditoria', () => {
  it('consulta somente GET e usa IDs corretos', async () => {
    const get = vi.fn().mockResolvedValue({ data: [] })
    const http = { get, post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() }
    const service = criarServicoAuditoria(http as unknown as AxiosInstance)
    await service.listar()
    await service.abrir(12)
    await service.versao(12, 2)
    await service.conversa('chat/12')
    await service.correcoes()
    expect(get.mock.calls.map((call) => call[0])).toEqual([
      '/api/campanhas/auditoria',
      '/api/campanhas/12',
      '/api/campanhas/12/versoes/2',
      '/api/chat/chat%2F12/mensagens',
      '/api/correcoes/auditoria',
    ])
    for (const metodo of [http.post, http.put, http.delete, http.patch])
      expect(metodo).not.toHaveBeenCalled()
  })

  it('lista, abre e resolve alertas técnicos com as rotas e payloads corretos', async () => {
    const alertaCriado = {
      id: 9,
      origem: 'MANUAL',
      tipo: 'MANUAL',
      descricao: 'Divergência no SQL',
      status: 'ABERTO',
      aberto_por: { id: 4, nome: 'Aline' },
      aberto_em: '2026-11-20T12:00:00Z',
      resolvido_por: null,
      resolvido_em: null,
      justificativa: null,
    }
    const alertaResolvido = {
      ...alertaCriado,
      status: 'RESOLVIDO',
      resolvido_por: { id: 4, nome: 'Aline' },
      resolvido_em: '2026-11-20T13:00:00Z',
      justificativa: 'Validado com o time de dados',
    }
    const get = vi.fn().mockResolvedValue({ data: [alertaCriado] })
    const post = vi
      .fn()
      .mockResolvedValueOnce({ data: alertaCriado })
      .mockResolvedValueOnce({ data: alertaResolvido })
    const http = { get, post }
    const service = criarServicoAuditoria(http as unknown as AxiosInstance)

    const lista = await service.listarAlertas(12, 2)
    const aberto = await service.abrirAlerta(12, 2, 'Divergência no SQL')
    const resolvido = await service.resolverAlerta(12, 2, 9, 'Validado com o time de dados')

    expect(lista).toEqual([alertaCriado])
    expect(aberto).toEqual(alertaCriado)
    expect(resolvido).toEqual(alertaResolvido)
    expect(get).toHaveBeenCalledWith('/api/campanhas/12/versoes/2/alertas')
    expect(post).toHaveBeenNthCalledWith(1, '/api/campanhas/12/versoes/2/alertas', {
      descricao: 'Divergência no SQL',
    })
    expect(post).toHaveBeenNthCalledWith(2, '/api/campanhas/12/versoes/2/alertas/9/resolver', {
      justificativa: 'Validado com o time de dados',
    })
  })
})
