import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Page from '../Page.vue'
import CardFilaBase from '../components/CardFilaBase.vue'
import CardFilaIntercorrencia from '../components/CardFilaIntercorrencia.vue'
import TabelaHistoricoSolicitacoes from '../components/TabelaHistoricoSolicitacoes.vue'

describe('Página Fila de Alterações (A6-129)', () => {
  it('renderiza o título principal e as abas de navegação', () => {
    const wrapper = mount(Page)

    expect(wrapper.find('h1').text()).toBe('Solicitações de Alteração')
    expect(wrapper.findAll('.aba-btn').map((b) => b.text())).toEqual([
      'Correção da Base',
      'Abertura de Intercorrência',
    ])
  })

  it('inicia na visualização Correção da Base e exibe banner correspondente', () => {
    const wrapper = mount(Page)

    expect(wrapper.find('.aviso-banner').text()).toContain(
      'Você está visualizando as solicitações de Correção da Base',
    )
    expect(wrapper.text()).toContain('Correção de dados incorretos ou desatualizados')
  })

  it('alterna para a visualização Abertura de Intercorrência ao clicar na aba', async () => {
    const wrapper = mount(Page)

    const abas = wrapper.findAll('.aba-btn')
    await abas[1]!.trigger('click')

    expect(wrapper.find('.aviso-banner').text()).toContain(
      'Você está visualizando as solicitações de Abertura de Intercorrência',
    )
    expect(wrapper.text()).toContain('Solicitações de abertura de intercorrências')
  })

  it('abre o modal de detalhes ao selecionar uma solicitação da fila', async () => {
    const wrapper = mount(Page)

    // Clica no primeiro card da fila
    const primeiroCard = wrapper.findComponent(CardFilaBase)
    expect(primeiroCard.exists()).toBe(true)

    await primeiroCard.trigger('click')

    const modal = wrapper.find('.modal-conteudo')
    expect(modal.exists()).toBe(true)
    expect(modal.text()).toContain('Detalhes da Correção da Base')
  })
})

describe('CardFilaBase (Figma 984:3544)', () => {
  it('renderiza os dados de tipo, competência e comparativo', () => {
    const wrapper = mount(CardFilaBase, {
      props: {
        solicitacao: {
          id: 1,
          tipo: 'Atualização',
          competencia: 'nov/2025',
          matriculasCount: 3,
          matriculas: ['MAT-1', 'MAT-2', 'MAT-3'],
          motivo: 'Transferência de loja',
          valorAnterior: 'Valor antigo',
          valorAposMudanca: 'Valor novo',
          solicitante: 'Roberval Silva',
          submetidoEm: '16/11',
          status: 'PENDENTE',
        },
      },
    })

    expect(wrapper.text()).toContain('Atualização')
    expect(wrapper.text()).toContain('nov/2025')
    expect(wrapper.text()).toContain('3 Matrículas')
    expect(wrapper.text()).toContain('Transferência de loja')
    expect(wrapper.text()).toContain('Valor antigo')
    expect(wrapper.text()).toContain('Valor novo')
    expect(wrapper.text()).toContain('Solicitado por Roberval Silva')
    expect(wrapper.text()).toContain('Submetido em 16/11')
  })
})

describe('CardFilaIntercorrencia (Figma 996:4945)', () => {
  it('renderiza o timeline de período e motivo', () => {
    const wrapper = mount(CardFilaIntercorrencia, {
      props: {
        solicitacao: {
          id: 101,
          tipo: 'Licença-Maternidade',
          matriculasCount: 1,
          matriculas: ['MAT-102'],
          inicio: '17/03',
          fim: '16/11',
          motivo: 'Licença maternidade',
          solicitante: 'Roberval Silva',
          submetidoEm: '16/11',
          status: 'PENDENTE',
        },
      },
    })

    expect(wrapper.text()).toContain('Licença-Maternidade')
    expect(wrapper.text()).toContain('17/03')
    expect(wrapper.text()).toContain('16/11')
    expect(wrapper.text()).toContain('Licença maternidade')
    expect(wrapper.text()).toContain('Solicitado por Roberval Silva')
  })
})

describe('TabelaHistoricoSolicitacoes (Figma 1009:4979 e 1009:5272)', () => {
  it('renderiza colunas de histórico de correção com competência', () => {
    const wrapper = mount(TabelaHistoricoSolicitacoes, {
      props: {
        tipoVisualizacao: 'correcao',
        itens: [
          {
            id: 'H1',
            motivo: 'Motivo de teste',
            tipo: 'Atualização',
            competencia: '11/2025',
            matriculas: 'MAT-1',
            status: 'Aprovado',
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Competência')
    expect(wrapper.text()).toContain('Motivo de teste')
    expect(wrapper.text()).toContain('11/2025')
    expect(wrapper.text()).toContain('Aprovado')
  })

  it('renderiza colunas de histórico de intercorrência com período', () => {
    const wrapper = mount(TabelaHistoricoSolicitacoes, {
      props: {
        tipoVisualizacao: 'intercorrencia',
        itens: [
          {
            id: 'HI1',
            motivo: 'Afastamento médico',
            tipo: 'Afastamento',
            periodo: '01/08/2025 - 30/09/2025',
            matriculas: 'MAT-88',
            status: 'Arquivado',
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Período')
    expect(wrapper.text()).toContain('Afastamento médico')
    expect(wrapper.text()).toContain('01/08/2025 - 30/09/2025')
    expect(wrapper.text()).toContain('Arquivado')
  })
})
