import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { reactive } from 'vue'
import Page from '../Page.vue'
import DetalheCampanha from '../components/DetalheCampanha.vue'
import CorrecoesBase from '../components/CorrecoesBase.vue'
import {
  campanhaReprovada,
  resumoBlackFriday,
  erroDoBackend,
} from '../../campanhas/__tests__/fakes'
import { regraBlackFriday, resultadoBlackFriday } from '../../chat/__tests__/fakes'
import type { VersaoCampanha } from '../../campanha/types'

const { service } = vi.hoisted(() => ({
  service: {
    listar: vi.fn(),
    abrir: vi.fn(),
    versao: vi.fn(),
    conversa: vi.fn(),
    correcoes: vi.fn(),
  },
}))
vi.mock('../services/auditoria', () => ({ obterServicoAuditoria: () => service }))
const route = reactive({ params: {} as Record<string, string> })
vi.mock('vue-router', async (original) => ({
  ...(await original<typeof import('vue-router')>()),
  useRoute: () => route,
}))
const global = { stubs: { RouterLink: { template: '<a><slot /></a>' } } }
enableAutoUnmount(afterEach)

function versao(numero: number): VersaoCampanha {
  return {
    campanha_id: 12,
    numero,
    status: numero === 1 ? 'REPROVADA' : 'APROVADA',
    acoes: ['APROVAR', 'REPROVAR', 'RESIMULAR'],
    autor: { id: 1, nome: 'Gabriela' },
    submetida_em: '2026-11-01T12:00:00Z',
    simulacao_id: 345,
    regra: regraBlackFriday({ pct_acrescimo: numero }),
    resultado: resultadoBlackFriday(),
    resimulacao_necessaria: false,
    aprovadas_depois: [],
    resimulacao: null,
    decisao: null,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  route.params = {}
  localStorage.setItem('perfil', 'AUDITOR')
  service.listar.mockResolvedValue([
    { ...resumoBlackFriday(), autor: { id: 1, nome: 'Gabriela' } },
    {
      ...resumoBlackFriday({ id: 13, nome: 'Campanha de Natal', status: 'ARQUIVADA' }),
      autor: { id: 2, nome: 'Sérgio' },
    },
  ])
  const detalhe = campanhaReprovada()
  detalhe.versoes.push({
    numero: 2,
    status: 'APROVADA',
    submetida_em: '2026-11-02T12:00:00Z',
    decisao: {
      decisao: 'APROVADA',
      por: { id: 3, nome: 'Sílvia' },
      em: '2026-11-02T14:00:00Z',
      justificativa: 'Aprovada após ajuste',
    },
  })
  service.abrir.mockResolvedValue(detalhe)
  service.versao.mockImplementation(async (_id, numero) => versao(numero))
  service.conversa.mockResolvedValue({
    chat_id: 'chat-da-gabriela',
    campanha_id: 12,
    mensagens: [
      {
        id: 1,
        papel: 'usuario',
        texto: 'Quero aumentar as comissões',
        criada_em: '2026-11-01T11:00:00Z',
      },
      {
        id: 2,
        papel: 'lana',
        texto: 'Consultei as vendas.',
        criada_em: '2026-11-01T11:00:01Z',
        trilha: {
          modelo: 'teste',
          tentativas: null,
          premissas: [],
          passos: [
            {
              ordem: 1,
              ferramenta: 'consultar_banco',
              descricao: 'Venda histórica por marca',
              tabelas_acessadas: ['venda'],
              competencias: ['2025-11'],
              filtros: null,
              sql_executado: 'SELECT segredo',
              registros_retornados: 1,
              dados: null,
              tempo_ms: 12,
              situacao: 'SUCESSO',
              mensagem_erro: null,
            },
          ],
        },
      },
    ],
  })
  service.correcoes.mockResolvedValue([
    {
      id: 7,
      tipo: 'TRANSFERENCIA_LOJA',
      matricula: 'MATRIC-38',
      competencia: '2026-11',
      antes: '33',
      depois: '8',
      motivo: 'Transferência',
      status: 'APROVADA',
      autor: { id: 1, nome: 'Gabriela' },
      criada_em: '2026-11-01T12:00:00Z',
      decisao: {
        decisao: 'APROVADA',
        por: { id: 2, nome: 'Sérgio' },
        em: '2026-11-02T12:00:00Z',
        justificativa: 'Conferido no RH',
      },
    },
  ])
})
afterEach(() => localStorage.clear())
async function clicar(wrapper: VueWrapper, texto: string) {
  const button = wrapper.findAll('button').find((b) => b.text() === texto)
  expect(button, `Botão ${texto}`).toBeDefined()
  await button!.trigger('click')
  await flushPromises()
}

describe('lista de auditoria', () => {
  it('mostra todos os autores, rascunhos e arquivadas, com período e data', async () => {
    const wrapper = mount(Page, { global })
    await flushPromises()
    expect(wrapper.text()).toContain('Gabriela')
    expect(wrapper.text()).toContain('Sérgio')
    expect(wrapper.text()).toContain('Rascunho')
    expect(wrapper.text()).toContain('Arquivada')
    expect(wrapper.text()).toContain('24/11/2025')
    expect(wrapper.text()).toContain('21/10/2026')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(service.abrir).not.toHaveBeenCalled()
  })
  it('combina busca por nome e filtro de status sem omitir status do sistema', async () => {
    const wrapper = mount(Page, { global })
    await flushPromises()
    expect(wrapper.findAll('option')).toHaveLength(6)
    await wrapper.get('input[type="search"]').setValue('NATAL')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    await wrapper.get('select').setValue('RASCUNHO')
    expect(wrapper.text()).toContain('Nenhuma campanha corresponde aos filtros')
    await wrapper.get('select').setValue('ARQUIVADA')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
  })
  it('exibe erro e permite repetir a consulta sem fingir lista vazia', async () => {
    service.listar.mockRejectedValueOnce(erroDoBackend(404, 'Não encontrado'))
    const wrapper = mount(Page, { global })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível carregar')
    expect(wrapper.text()).not.toContain('Nenhuma campanha registrada')
    await clicar(wrapper, 'Tentar novamente')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })
  it('distingue lista vazia e autor ainda ausente no contrato', async () => {
    service.listar.mockResolvedValueOnce([])
    const wrapper = mount(Page, { global })
    await flushPromises()
    expect(wrapper.text()).toContain('Nenhuma campanha registrada')
    wrapper.unmount()
    service.listar.mockResolvedValueOnce([resumoBlackFriday()])
    const outra = mount(Page, { global })
    await flushPromises()
    expect(outra.text()).toContain('Autor não informado')
  })
  it('ID inválido não dispara consulta de detalhe', async () => {
    route.params = { id: 'invalido' }
    const wrapper = mount(Page, { global })
    await flushPromises()
    expect(wrapper.text()).toContain('Campanha não encontrada')
    expect(service.abrir).not.toHaveBeenCalled()
  })
})

describe('detalhe somente leitura', () => {
  it('exibe parâmetros, comparação e resultado sem ações de escrita', async () => {
    const wrapper = mount(DetalheCampanha, { props: { id: 12 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('Diferenças: versão 1 → versão 2')
    expect(wrapper.get('mark').text()).toBe('2%')
    expect(wrapper.text()).toContain('Resultado da simulação')
    const botoes = wrapper.findAll('button').map((b) => b.text())
    for (const proibido of [
      'Simular',
      'Editar',
      'Submeter',
      'Aprovar',
      'Reprovar',
      'Usar no painel',
    ])
      expect(botoes).not.toContain(proibido)
    expect(service.versao).toHaveBeenCalledWith(12, 1)
    expect(service.versao).toHaveBeenCalledWith(12, 2)
  })
  it('mostra as decisões de todas as versões, decisor, data e justificativa', async () => {
    const wrapper = mount(DetalheCampanha, { props: { id: 12 }, global })
    await flushPromises()
    await clicar(wrapper, 'Decisões')
    expect(wrapper.text()).toContain('Versão 1 — Reprovada')
    expect(wrapper.text()).toContain('Sérgio')
    expect(wrapper.text()).toContain('Versão 2 — Aprovada')
    expect(wrapper.text()).toContain('Sílvia')
    expect(wrapper.text()).toContain('Aprovada após ajuste')
    expect(wrapper.findAll('.decisao')).toHaveLength(2)
  })
  it('reabre a conversa e a trilha sem compositor nem SQL da aba técnica', async () => {
    const wrapper = mount(DetalheCampanha, { props: { id: 12 }, global })
    await flushPromises()
    await clicar(wrapper, 'Conversa')
    expect(wrapper.text()).toContain('Quero aumentar as comissões')
    expect(wrapper.text()).toContain('Consultei as vendas.')
    expect(wrapper.findAll('input,textarea,form')).toHaveLength(0)
    const ferramentas = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Usou 1 ferramenta'))!
    await ferramentas.trigger('click')
    expect(wrapper.text()).toContain('Venda histórica por marca')
    expect(wrapper.text()).not.toContain('SELECT segredo')
  })
  it('rascunho sem versões permite consultar a última ficha e simulação', async () => {
    service.abrir.mockResolvedValueOnce(
      campanhaReprovada({ status: 'RASCUNHO', versoes: [], versao_atual: null }),
    )
    const wrapper = mount(DetalheCampanha, { props: { id: 12 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('ainda não possui versões submetidas')
    expect(wrapper.text()).toContain('Parâmetros atuais')
    expect(wrapper.text()).toContain('Resultado da simulação')
  })
  it('não mistura dados antigos ao navegar rapidamente entre campanhas', async () => {
    let responder!: (valor: unknown) => void
    service.abrir.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          responder = resolve
        }),
    )
    const wrapper = mount(DetalheCampanha, { props: { id: 12 }, global })
    await wrapper.setProps({ id: 13 })
    await flushPromises()
    responder(campanhaReprovada({ nome: 'Resposta antiga' }))
    await flushPromises()
    expect(wrapper.text()).not.toContain('Resposta antiga')
    expect(wrapper.text()).toContain('Black Friday 2025')
  })
  it('falha na conversa não oculta as versões e mostra erro na aba correta', async () => {
    service.conversa.mockRejectedValueOnce(new Error('offline'))
    const wrapper = mount(DetalheCampanha, { props: { id: 12 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('Diferenças: versão 1 → versão 2')
    await clicar(wrapper, 'Conversa')
    expect(wrapper.get('[role="alert"]').text()).toContain('a conversa')
  })
  it('falha parcial de versões é visível e não vira ausência de versões', async () => {
    service.versao.mockRejectedValueOnce(new Error('offline'))
    const wrapper = mount(DetalheCampanha, { props: { id: 12 }, global })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('todas as versões')
    expect(wrapper.text()).not.toContain('ainda não possui versões submetidas')
  })
})

describe('correções da base', () => {
  it('mostra antes/depois, autor, decisão, data e justificativa sem ações', async () => {
    const wrapper = mount(CorrecoesBase)
    await flushPromises()
    for (const texto of ['33', '8', 'Gabriela', 'Sérgio', 'Conferido no RH'])
      expect(wrapper.text()).toContain(texto)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })
  it('endpoint ainda indisponível exibe falha em vez de nenhuma correção', async () => {
    service.correcoes.mockRejectedValueOnce(erroDoBackend(404, 'Indisponível'))
    const wrapper = mount(CorrecoesBase)
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('as correções da base')
    expect(wrapper.text()).not.toContain('Nenhuma correção registrada')
    await clicar(wrapper, 'Tentar novamente')
    expect(wrapper.text()).toContain('Transferência de loja')
  })
})
