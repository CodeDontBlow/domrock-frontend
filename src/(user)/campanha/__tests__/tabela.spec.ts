import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TabelaCampanhas, { type Tabela } from '../components/TabelaCampanhas.vue'

function linha(sobrescrever: Partial<Tabela>): Tabela {
  return {
    id: 1,
    titulo: 'Black Friday 2025',
    inicio: '24/11/2025',
    fim: '30/11/2025',
    autor: 'Gabriela',
    aprovador: 'Sérgio',
    vigencia: 'VIGENTE',
    sobreposicoes: [],
    percentual: '+1,0%',
    ...sobrescrever,
  }
}

const campanhas: Tabela[] = [
  linha({ id: 1, titulo: 'Black Friday 2025', vigencia: 'VIGENTE' }),
  linha({ id: 2, titulo: 'Natal', vigencia: 'ENCERRADA', inicio: '01/12/2024', fim: '24/12/2024' }),
  linha({ id: 3, titulo: 'Gerentes', vigencia: 'ENCERRADA', inicio: '01/10/2025', fim: '31/10/2025' }),
]

const abas = (tela: ReturnType<typeof mount>) => tela.findAll('[role="tab"]')
const titulos = (tela: ReturnType<typeof mount>) =>
  tela.findAll('tbody .titulo-texto').map((celula) => celula.text())

describe('TabelaCampanhas: abas por vigência', () => {
  it('abre em Em andamento e mostra a contagem de cada aba', () => {
    const tela = mount(TabelaCampanhas, { props: { campanhas } })

    expect(abas(tela).map((aba) => aba.text())).toEqual([
      'Realizadas · 2',
      'Em andamento · 1',
      'Previstas · 0',
    ])
    expect(abas(tela)[1]!.attributes('aria-selected')).toBe('true')
    expect(titulos(tela)).toEqual(['Black Friday 2025'])
  })

  it('agrupa só pela vigência que veio do servidor', async () => {
    const tela = mount(TabelaCampanhas, { props: { campanhas } })

    await abas(tela)[0]!.trigger('click')

    expect(titulos(tela)).toEqual(['Natal', 'Gerentes'])
    expect(tela.text()).toContain('Visualizando 2 campanhas')
  })

  it('aba sem campanhas mostra a mensagem dela', async () => {
    const tela = mount(TabelaCampanhas, { props: { campanhas } })

    await abas(tela)[2]!.trigger('click')

    expect(tela.find('.empty-state').text()).toBe('Nenhuma campanha aprovada com início futuro.')
  })

  it('cada aba tem a própria mensagem de vazia', async () => {
    const tela = mount(TabelaCampanhas, { props: { campanhas: [] } })

    expect(tela.find('.empty-state').text()).toBe('Nenhuma campanha aprovada em andamento hoje.')
    await abas(tela)[0]!.trigger('click')
    expect(tela.find('.empty-state').text()).toBe('Nenhuma campanha aprovada com período encerrado.')
  })

  it('mostra período, autor, aprovador e o aviso de sobreposição', () => {
    const tela = mount(TabelaCampanhas, {
      props: {
        campanhas: [
          linha({
            sobreposicoes: [
              {
                nome: 'Esquenta Black Friday',
                descricao: 'Sobrepõe a Esquenta Black Friday (aprovada) em 24 a 26/11',
              },
            ],
          }),
        ],
      },
    })

    const celulas = tela.findAll('tbody tr td').map((celula) => celula.text())
    expect(celulas[0]).toContain('Sobrepõe a Esquenta Black Friday')
    expect(celulas.slice(1, 4)).toEqual(['24/11/2025 – 30/11/2025', 'Gabriela', 'Sérgio'])
    expect(tela.find('.aviso-sobreposicao').attributes('title')).toBe(
      'Sobrepõe a Esquenta Black Friday (aprovada) em 24 a 26/11',
    )
  })

  it('clicar na linha seleciona a campanha', async () => {
    const tela = mount(TabelaCampanhas, { props: { campanhas } })

    await tela.find('tbody tr').trigger('click')

    expect(tela.emitted('selecionar')?.[0]?.[0]).toMatchObject({ id: 1 })
  })
})
