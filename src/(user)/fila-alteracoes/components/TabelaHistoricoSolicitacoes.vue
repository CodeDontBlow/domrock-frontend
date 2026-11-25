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
  status: 'Aprovado' | 'Arquivado'
}

const props = withDefaults(
  defineProps<{
    itens: ItemTabelaHistorico[]
    tipoVisualizacao?: VisualizacaoFila
    itensPorPagina?: number
  }>(),
  {
    tipoVisualizacao: 'correcao',
    itensPorPagina: 5,
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
    mensagem-vazia="Nenhuma solicitação encontrada no histórico."
    aria-label="Histórico de Solicitações"
    aria-label-paginacao="Paginação do histórico de solicitações"
    @selecionar="(item) => emit('selecionar', item)"
  >
    <!-- Slot customizado para renderizar a tag/badge do Status -->
    <template #cell-status="{ valor }">
      <span
        class="selo-status inline-flex items-center px-3 py-[3px] rounded-full font-inconsolata text-label font-medium whitespace-nowrap"
        :class="valor === 'Aprovado' ? 'bg-blue/15 text-blue' : 'bg-gray-txt2-dark/15 text-gray-txt2-dark'"
      >
        {{ valor }}
      </span>
    </template>
  </TabelaPadrao>
</template>
