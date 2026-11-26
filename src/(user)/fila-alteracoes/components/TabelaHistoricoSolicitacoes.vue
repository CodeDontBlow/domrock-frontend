<script setup lang="ts">
import { computed } from 'vue'
import TabelaPadrao, { type ColunaTabela } from '@/components/TabelaPadrao.vue'
import type { VisualizacaoFila } from '../types'

export interface ItemTabelaHistorico {
  id: string | number
  motivo: string
  tipo: string
  competencia?: string
  periodo?: string
  matriculas: string
  status: string
  justificativa?: string | null
}

const props = withDefaults(
  defineProps<{
    itens: ItemTabelaHistorico[]
    tipoVisualizacao?: VisualizacaoFila
    itensPorPagina?: number
    mensagemVazia?: string
  }>(),
  {
    tipoVisualizacao: 'correcao',
    itensPorPagina: 5,
    mensagemVazia: 'Nenhum pedido encontrado em Meus pedidos.',
  },
)

const emit = defineEmits<{
  (e: 'selecionar', item: ItemTabelaHistorico): void
}>()

const colunas = computed<ColunaTabela[]>(() => {
  if (props.tipoVisualizacao === 'correcao') {
    return [
      {
        chave: 'motivo',
        titulo: 'Motivo da Solicitação',
        icone: 'bi bi-tag',
      },
      {
        chave: 'tipo',
        titulo: 'Tipo',
        icone: 'bi bi-card-text',
      },
      {
        chave: 'competencia',
        titulo: 'Competência',
        icone: 'bi bi-calendar',
      },
      {
        chave: 'matriculas',
        titulo: 'Matrículas',
        icone: 'bi bi-person-video',
      },
      {
        chave: 'status',
        titulo: 'Status',
        icone: 'bi bi-activity',
      },
      {
        chave: 'justificativa',
        titulo: 'Justificativa',
        icone: 'bi bi-chat-left-text',
      },
    ]
  }

  return [
    {
      chave: 'motivo',
      titulo: 'Motivo da Solicitação',
      icone: 'bi bi-tag',
    },
    {
      chave: 'tipo',
      titulo: 'Tipo',
      icone: 'bi bi-card-text',
    },
    {
      chave: 'periodo',
      titulo: 'Período',
      icone: 'bi bi-calendar',
    },
    {
      chave: 'matriculas',
      titulo: 'Matrículas',
      icone: 'bi bi-person-video',
    },
    {
      chave: 'status',
      titulo: 'Status',
      icone: 'bi bi-activity',
    },
    {
      chave: 'justificativa',
      titulo: 'Justificativa',
      icone: 'bi bi-chat-left-text',
    },
  ]
})
</script>

<template>
  <TabelaPadrao
    :colunas="colunas"
    :dados="itens"
    :itens-por-pagina="itensPorPagina"
    :coluna-ordenacao-padrao="tipoVisualizacao === 'correcao' ? 'competencia' : 'periodo'"
    ordem-padrao="decrescente"
    :mensagem-vazia="mensagemVazia"
    @selecionar="(item) => emit('selecionar', item as unknown as ItemTabelaHistorico)"
  />
</template>
