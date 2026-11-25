<script setup lang="ts">
import { computed } from 'vue'
import type { SolicitacaoBaseCard, SolicitacaoIntercorrenciaCard } from '../types'

const props = defineProps<{
  solicitacao: SolicitacaoBaseCard | SolicitacaoIntercorrenciaCard | null
  tipoVisualizacao: 'correcao' | 'intercorrencia'
}>()

const emit = defineEmits<{
  (e: 'fechar'): void
  (e: 'aprovar', id: string | number): void
  (e: 'arquivar', id: string | number): void
}>()

const ehBase = computed(() => props.tipoVisualizacao === 'correcao')
const itemBase = computed(() => (ehBase.value ? (props.solicitacao as SolicitacaoBaseCard) : null))
const itemIntercorrencia = computed(() =>
  !ehBase.value ? (props.solicitacao as SolicitacaoIntercorrenciaCard) : null,
)
function formatarSolicitante(nome?: string): string {
  if (!nome) return 'Solicitado via chat'
  const normalizado = nome.trim().toLowerCase()
  if (normalizado === 'lana / chat' || normalizado === 'chat / lana' || normalizado === 'chat' || normalizado === 'lana') {
    return 'Solicitado via chat'
  }
  return `Solicitado por: ${nome}`
}
</script>

<template>
  <div
    v-if="solicitacao"
    class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-detalhe-titulo"
    @click.self="emit('fechar')"
    @keydown.esc="emit('fechar')"
  >
    <div class="modal-conteudo w-full max-w-[650px] bg-black-bg1 border-2 border-black-bg2 rounded-2xl p-6 flex flex-col gap-5 text-white-txt1 font-raleway shadow-2xl">
      <header class="modal-header flex justify-between items-center">
        <div class="modal-titulo-bloco flex items-center gap-2.5">
          <i
            class="bi text-[24px] text-blue"
            :class="ehBase ? 'bi-database-exclamation' : 'bi-person-exclamation'"
            aria-hidden="true"
          />
          <h2 id="modal-detalhe-titulo" class="m-0 text-header-3 font-bold">
            {{ ehBase ? 'Detalhes da Correção da Base' : 'Detalhes da Intercorrência' }}
          </h2>
        </div>

        <button
          type="button"
          class="modal-btn-fechar bg-transparent border-0 text-gray-txt2-dark text-[18px] cursor-pointer p-1 transition-colors hover:text-white-txt1"
          aria-label="Fechar modal"
          @click="emit('fechar')"
        >
          <i class="bi bi-x-lg" aria-hidden="true" />
        </button>
      </header>

      <div class="modal-corpo flex flex-col gap-4">
        <!-- Tags / Metadados -->
        <div class="modal-tags flex flex-wrap gap-2.5">
          <span class="inline-flex items-center px-3 py-1 rounded-full font-inconsolata text-label bg-blue/15 text-blue">
            Tipo: {{ solicitacao.tipo }}
          </span>
          <span v-if="ehBase && itemBase" class="inline-flex items-center px-3 py-1 rounded-full font-inconsolata text-label bg-blue/15 text-blue">
            Competência: {{ itemBase.competencia }}
          </span>
          <span v-if="!ehBase && itemIntercorrencia" class="inline-flex items-center px-3 py-1 rounded-full font-inconsolata text-label bg-blue/15 text-blue">
            Período: {{ itemIntercorrencia.inicio }} até {{ itemIntercorrencia.fim }}
          </span>
          <span class="inline-flex items-center px-3 py-1 rounded-full font-inconsolata text-label bg-gray-txt2-dark/15 text-gray-txt2-dark">
            Matrículas: {{ solicitacao.matriculas.join(', ') }}
          </span>
        </div>

        <!-- Bloco de Comparação para Correção de Base -->
        <div v-if="ehBase && itemBase" class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3 bg-black-bg2 p-3.5 rounded-[10px]">
          <div class="flex flex-col gap-1">
            <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">VALOR ANTERIOR</span>
            <p class="m-0 font-inconsolata text-label text-white-txt1 leading-snug">{{ itemBase.valorAnterior }}</p>
          </div>
          <i class="bi bi-arrow-right text-[18px] text-gray-txt3-dark self-center hidden sm:block" aria-hidden="true" />
          <i class="bi bi-arrow-down text-[18px] text-gray-txt3-dark self-center block sm:hidden" aria-hidden="true" />
          <div class="flex flex-col gap-1">
            <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">VALOR APÓS MUDANÇA</span>
            <p class="m-0 font-inconsolata text-label text-white-txt1 leading-snug">{{ itemBase.valorAposMudanca }}</p>
          </div>
        </div>

        <!-- Descrição / Motivo -->
        <div class="flex flex-col gap-1.5">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">MOTIVO DA SOLICITAÇÃO</span>
          <p class="m-0 text-body text-white-txt1 leading-relaxed bg-black-bg2 p-3 rounded-lg">{{ solicitacao.motivo }}</p>
        </div>

        <!-- Informações de Submissão -->
        <div class="flex justify-between items-center flex-wrap gap-2 text-gray-txt2-dark font-inconsolata text-metadata pt-1 border-t border-black-bg2">
          <span><strong class="text-white-txt1">{{ formatarSolicitante(solicitacao.solicitante) }}</strong></span>
          <span>Data de envio: <strong class="text-white-txt1">{{ solicitacao.submetidoEm }}</strong></span>
        </div>
      </div>

      <footer class="flex justify-end gap-3 pt-2 border-t border-black-bg2">
        <button
          type="button"
          class="py-2.5 px-4.5 rounded-full font-raleway text-label font-medium cursor-pointer transition-colors bg-transparent border border-gray-txt2-dark text-gray-txt2-dark hover:bg-white/5 hover:border-white-txt1 hover:text-white-txt1"
          @click="emit('arquivar', solicitacao.id)"
        >
          Arquivar Solicitação
        </button>

        <button
          type="button"
          class="py-2.5 px-5 rounded-full font-raleway text-label font-semibold cursor-pointer transition-all bg-blue border border-blue text-black-bg1 hover:brightness-110"
          @click="emit('aprovar', solicitacao.id)"
        >
          Aprovar Alteração
        </button>
      </footer>
    </div>
  </div>
</template>
