import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { atualizarPerfil, type Perfil } from '@/composables/usePerfil'
import type { AlertaTecnico, CampanhaDetalhe, VersaoCampanha } from '../../campanha/types'
import { regraBlackFriday, resultadoBlackFriday } from '../../chat/__tests__/fakes'
import AbaTecnica from '../components/AbaTecnica.vue'
import DetalheCampanha from '../components/DetalheCampanha.vue'

const servicoMock = {
  listar: vi.fn(),
  abrir: vi.fn(),
  versao: vi.fn(),
  conversa: vi.fn(),
  correcoes: vi.fn(),
  listarAlertas: vi.fn(),
  abrirAlerta: vi.fn(),
  resolverAlerta: vi.fn(),
}

vi.mock('../services/auditoria', () => ({
  obterServicoAuditoria: () => servicoMock,
}))

function definirPerfil(perfil: Perfil): void {
  localStorage.setItem('perfil', perfil)
  atualizarPerfil()
}

function alertaFake(sobrescrever: Partial<AlertaTecnico> = {}): AlertaTecnico {
  return {
    id: 1,
    campanha_id: 7,
    numero_versao: 1,
    origem: 'AUTOMATICO',
    tipo: 'SQL_BLOQUEADO',
    descricao: 'Tentativa de leitura fora da tabela permitida',
    status: 'ABERTO',
    aberto_por: 'Sistema',
    aberto_em: '2026-11-20T14:00:00Z',
    resolvido_por: null,
    resolvido_em: null,
    justificativa: null,
    ...sobrescrever,
  }
}

function versaoComTrilha(sobrescrever: Partial<VersaoCampanha> = {}): VersaoCampanha {
  return {
    campanha_id: 7,
    numero: 1,
    status: 'AGUARDANDO_APROVACAO',
    acoes: ['APROVAR', 'REPROVAR'],
    autor: { id: 1, nome: 'Gabriela' },
    submetida_em: '2026-11-20T13:30:00Z',
    simulacao_id: 30,
    regra: regraBlackFriday(),
    resultado: {
      ...resultadoBlackFriday(),
      codigo: 'def aplicar_regra(df):\n    return df.assign(bonus=0.01)',
      trilha: {
        modelo: 'gemini-2.5-flash',
        tentativas: 1,
        premissas: [],
        passos: [
          {
            ordem: 1,
            ferramenta: 'consultar_banco',
            descricao: 'Consulta de vendas de novembro',
            tabelas_acessadas: ['venda', 'loja'],
            competencias: ['2025-11'],
            filtros: 'marca = 10',
            sql_executado: 'SELECT SUM(valor) FROM venda WHERE competencia = 202511',
            registros_retornados: 12,
            dados: null,
            tempo_ms: 420,
            situacao: 'SUCESSO',
            mensagem_erro: null,
          },
          {
            ordem: 2,
            ferramenta: 'consultar_banco',
            descricao: 'Tentativa em tabela restrita',
            tabelas_acessadas: ['folha_salarial'],
            competencias: ['2025-11'],
            filtros: null,
            sql_executado: 'SELECT * FROM folha_salarial',
            registros_retornados: null,
            dados: null,
            tempo_ms: 50,
            situacao: 'BLOQUEADA',
            mensagem_erro: 'Acesso à tabela folha_salarial bloqueado pelo guard',
          },
        ],
      },
    },
    resimulacao_necessaria: false,
    aprovadas_depois: [],
    resimulacao: null,
    decisao: null,
    alertas: [
      alertaFake(),
      alertaFake({
        id: 2,
        origem: 'MANUAL',
        tipo: 'REVISAO_MANUAL',
        descricao: 'Verificar arredondamento',
        status: 'RESOLVIDO',
        aberto_por: { id: 9, nome: 'Aline Auditora' },
        resolvido_por: { id: 9, nome: 'Aline Auditora' },
        resolvido_em: '2026-11-20T16:15:00Z',
        justificativa: 'Arredondamento conferido com o financeiro',
      }),
    ],
    ...sobrescrever,
  }
}

function campanhaDetalheFake(): CampanhaDetalhe {
  return {
    id: 7,
    nome: 'Black Friday',
    status: 'AGUARDANDO_APROVACAO',
    vigencia: 'FUTURA',
    em_simulacao: false,
    acoes: [],
    autor: { id: 1, nome: 'Gabriela' },
    chat_id: 'chat-7',
    periodo: { data_inicio: '2025-11-24', data_fim: '2025-11-30' },
    versao_atual: 1,
    ultima_simulacao: null,
    versoes: [
      {
        numero: 1,
        status: 'AGUARDANDO_APROVACAO',
        submetida_em: '2026-11-20T13:30:00Z',
        decisao: null,
      },
    ],
    criada_em: '2026-11-20T12:00:00Z',
    atualizada_em: '2026-11-20T13:30:00Z',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  atualizarPerfil()
})

afterEach(() => {
  localStorage.clear()
  atualizarPerfil()
})

enableAutoUnmount(afterEach)

describe('AbaTecnica', () => {
  it('renderiza SQLs da trilha, destaque de consulta bloqueada, código Python e alertas', async () => {
    definirPerfil('AUDITOR')
    const versao = versaoComTrilha()
    servicoMock.listarAlertas.mockResolvedValue(versao.alertas)

    const wrapper = mount(AbaTecnica, {
      props: { campanhaId: 7, versao },
    })
    await flushPromises()

    const texto = wrapper.text()
    expect(texto).toContain('SELECT SUM(valor) FROM venda WHERE competencia = 202511')
    expect(texto).toContain('Consulta bloqueada')
    expect(texto).toContain('Acesso à tabela folha_salarial bloqueado pelo guard')
    expect(wrapper.find('.passo-bloqueado .passo-alerta-erro').exists()).toBe(true)
    expect(wrapper.find('.passo-bloqueado .passo-alerta-erro').attributes('role')).toBe('note')
    expect(wrapper.find('pre.codigo-python code').text()).toContain('def aplicar_regra(df):')
    expect(wrapper.find('pre.codigo-python').attributes('tabindex')).toBe('0')
    expect(wrapper.find('pre.codigo-python').attributes('role')).toBe('region')
    expect(texto).toContain('ABERTO')
    expect(texto).toContain('AUTOMATICO')
    expect(texto).toContain('Tentativa de leitura fora da tabela permitida')
    expect(texto).toContain('RESOLVIDO')
    expect(texto).toContain('MANUAL')
    expect(texto).toContain('Aline Auditora')
    expect(texto).toContain('Arredondamento conferido com o financeiro')
  })

  it('usa fallback de versao.alertas se listarAlertas falhar', async () => {
    definirPerfil('SUPERVISOR')
    const versao = versaoComTrilha()
    servicoMock.listarAlertas.mockRejectedValue(new Error('404'))

    const wrapper = mount(AbaTecnica, {
      props: { campanhaId: 7, versao },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Tentativa de leitura fora da tabela permitida')
    expect(wrapper.text()).toContain('Arredondamento conferido com o financeiro')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('Auditor valida campo obrigatório, abre e resolve alerta e exibe erro de API no modal sem window.alert', async () => {
    definirPerfil('AUDITOR')
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const alertaInicial = alertaFake()
    const alertaNovo = alertaFake({
      id: 10,
      origem: 'MANUAL',
      tipo: 'MANUAL',
      descricao: 'Divergência nos filtros de loja',
      aberto_por: { id: 9, nome: 'Aline Auditora' },
    })
    const alertaResolvido = alertaFake({
      ...alertaNovo,
      status: 'RESOLVIDO',
      resolvido_por: { id: 9, nome: 'Aline Auditora' },
      resolvido_em: '2026-11-20T17:00:00Z',
      justificativa: 'Confirmado bloqueio sem impacto no resultado',
    })

    servicoMock.listarAlertas.mockResolvedValue([alertaInicial])
    const config = {} as InternalAxiosRequestConfig
    servicoMock.abrirAlerta
      .mockRejectedValueOnce(
        new AxiosError('Conflict', 'ERR_BAD_REQUEST', config, null, {
          status: 409,
          statusText: 'Conflict',
          headers: {},
          config,
          data: { detail: 'Já existe alerta semelhante aberto.' },
        }),
      )
      .mockResolvedValueOnce(alertaNovo)
    servicoMock.resolverAlerta
      .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK', config))
      .mockResolvedValueOnce(alertaResolvido)

    const wrapper = mount(AbaTecnica, {
      props: { campanhaId: 7, versao: versaoComTrilha({ alertas: [alertaInicial] }) },
    })
    await flushPromises()

    // Abrir modal de novo alerta
    const btnAbrir = wrapper
      .findAll('button')
      .find((botao) => botao.text().includes('Abrir alerta'))
    expect(btnAbrir?.exists()).toBe(true)
    await btnAbrir!.trigger('click')

    // Envio vazio mostra validação e não chama a API
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[role="dialog"] [role="alert"]').text()).toContain(
      'Informe a descrição do alerta.',
    )
    expect(servicoMock.abrirAlerta).not.toHaveBeenCalled()

    // Envio com erro 409 exibe mensagem da API dentro do modal
    await wrapper.find('[role="dialog"] textarea').setValue('Divergência nos filtros de loja')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="dialog"] [role="alert"]').text()).toContain(
      'Já existe alerta semelhante aberto.',
    )
    expect(alertSpy).not.toHaveBeenCalled()

    // Nova tentativa com sucesso adiciona alerta na lista e fecha modal
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(servicoMock.abrirAlerta).toHaveBeenCalledWith(7, 1, 'Divergência nos filtros de loja')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Divergência nos filtros de loja')

    // Resolver alerta aberto
    const btnResolver = wrapper
      .findAll('button')
      .find((botao) => botao.text().includes('Resolver alerta'))
    expect(btnResolver?.exists()).toBe(true)
    await btnResolver!.trigger('click')

    // Validação de justificativa obrigatória
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('[role="dialog"] [role="alert"]').text()).toContain(
      'Informe a justificativa para resolver o alerta.',
    )
    expect(servicoMock.resolverAlerta).not.toHaveBeenCalled()

    // Erro de rede ao resolver aparece dentro do modal, sem window.alert
    await wrapper
      .find('[role="dialog"] textarea')
      .setValue('Confirmado bloqueio sem impacto no resultado')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="dialog"] [role="alert"]').text()).toContain(
      'Erro de conexão com o servidor. Tente novamente.',
    )
    expect(alertSpy).not.toHaveBeenCalled()

    // Nova tentativa resolve com sucesso e atualiza a lista
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(servicoMock.resolverAlerta).toHaveBeenCalledWith(
      7,
      1,
      alertaNovo.id,
      'Confirmado bloqueio sem impacto no resultado',
    )
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Confirmado bloqueio sem impacto no resultado')
    expect(
      wrapper.findAll('button').filter((b) => b.text().includes('Resolver alerta')),
    ).toHaveLength(1)
    alertSpy.mockRestore()
  })

  it('Supervisor vê os alertas, mas não vê botões de abrir ou resolver alerta', async () => {
    definirPerfil('SUPERVISOR')
    const versao = versaoComTrilha()
    servicoMock.listarAlertas.mockResolvedValue(versao.alertas)

    const wrapper = mount(AbaTecnica, {
      props: { campanhaId: 7, versao },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Tentativa de leitura fora da tabela permitida')
    const textosBotoes = wrapper.findAll('button').map((b) => b.text())
    expect(textosBotoes.some((t) => t.includes('Abrir alerta'))).toBe(false)
    expect(textosBotoes.some((t) => t.includes('Resolver alerta'))).toBe(false)
  })
})

describe('DetalheCampanha — visibilidade da aba Técnica por perfil', () => {
  function montarDetalhe() {
    const versao = versaoComTrilha()
    servicoMock.abrir.mockResolvedValue(campanhaDetalheFake())
    servicoMock.versao.mockResolvedValue(versao)
    servicoMock.conversa.mockResolvedValue({ chat_id: 'chat-7', campanha_id: 7, mensagens: [] })
    servicoMock.listarAlertas.mockResolvedValue(versao.alertas)

    return mount(DetalheCampanha, {
      props: { id: 7 },
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          ResultadoSimulacao: true,
        },
      },
    })
  }

  it('Gerente não vê a aba Técnica', async () => {
    definirPerfil('GERENTE')
    const wrapper = montarDetalhe()
    await flushPromises()

    const abas = wrapper.findAll('nav.abas button').map((b) => b.text())
    expect(abas).toEqual(['Versões', 'Decisões', 'Conversa'])
  })

  it('Supervisor vê a aba Técnica e visualiza alertas sem botões de abrir/resolver', async () => {
    definirPerfil('SUPERVISOR')
    const wrapper = montarDetalhe()
    await flushPromises()

    const abaTecnica = wrapper.findAll('nav.abas button').find((b) => b.text() === 'Técnica')
    expect(abaTecnica?.exists()).toBe(true)

    await abaTecnica!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Trilha com SQLs executados')
    expect(wrapper.text()).toContain('Tentativa de leitura fora da tabela permitida')
    const textosBotoes = wrapper.findAll('button').map((b) => b.text())
    expect(textosBotoes.some((t) => t.includes('Abrir alerta'))).toBe(false)
    expect(textosBotoes.some((t) => t.includes('Resolver alerta'))).toBe(false)
  })

  it('Auditor vê a aba Técnica com botões de abrir e resolver alerta', async () => {
    definirPerfil('AUDITOR')
    const wrapper = montarDetalhe()
    await flushPromises()

    const abaTecnica = wrapper.findAll('nav.abas button').find((b) => b.text() === 'Técnica')
    expect(abaTecnica?.exists()).toBe(true)

    await abaTecnica!.trigger('click')
    await flushPromises()

    const textosBotoes = wrapper.findAll('button').map((b) => b.text())
    expect(textosBotoes.some((t) => t.includes('Abrir alerta'))).toBe(true)
    expect(textosBotoes.some((t) => t.includes('Resolver alerta'))).toBe(true)
  })

  it('clicar na aba Técnica chama listarAlertas apenas 1 vez, sem loop de recarga', async () => {
    definirPerfil('AUDITOR')
    const wrapper = montarDetalhe()
    await flushPromises()

    const abaTecnica = wrapper.findAll('nav.abas button').find((b) => b.text() === 'Técnica')
    expect(abaTecnica?.exists()).toBe(true)

    await abaTecnica!.trigger('click')
    await flushPromises()

    expect(servicoMock.listarAlertas).toHaveBeenCalledTimes(1)
  })
})
