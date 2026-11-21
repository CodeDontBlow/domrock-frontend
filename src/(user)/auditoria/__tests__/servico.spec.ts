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
})
