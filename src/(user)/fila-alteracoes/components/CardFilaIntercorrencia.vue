<script setup lang="ts">
import type { SolicitacaoIntercorrenciaCard } from '../types'

defineProps<{
  solicitacao: SolicitacaoIntercorrenciaCard
  selecionavel?: boolean
}>()

const emit = defineEmits<{
  (e: 'selecionar', solicitacao: SolicitacaoIntercorrenciaCard): void
}>()

function formatarSolicitante(nome?: string): string {
  if (!nome) return 'Solicitado via chat'
  const normalizado = nome.trim().toLowerCase()
  if (normalizado === 'lana / chat' || normalizado === 'chat / lana' || normalizado === 'chat' || normalizado === 'lana') {
    return 'Solicitado via chat'
  }
  return `Solicitado por ${nome}`
}
</script>

<template>
  <article
    class="w-[389px] min-w-[340px] max-sm:w-full max-sm:min-w-0 shrink-0 flex flex-col justify-between bg-black-bg2 border border-gray-txt3-dark rounded-[10px] font-raleway text-white-txt1 box-border transition-all duration-150 outline-none"
    :class="selecionavel ? 'cursor-pointer hover:border-blue focus-visible:border-blue focus-visible:-translate-y-0.5' : ''"
    tabindex="0"
    role="button"
    @click="emit('selecionar', solicitacao)"
    @keydown.enter="emit('selecionar', solicitacao)"
    @keydown.space.prevent="emit('selecionar', solicitacao)"
  >
    <div class="p-4 flex flex-col gap-4">
      <!-- Tags superiores: TIPO, MATRÍCULAS, STATUS/IMPACTO -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex flex-col gap-1">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">TIPO</span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full font-inconsolata text-label leading-[18px] whitespace-nowrap bg-blue/15 text-blue">
            {{ solicitacao.tipo }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">MATRÍCULAS</span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full font-inconsolata text-label leading-[18px] whitespace-nowrap bg-gray-txt2-dark/15 text-gray-txt2-dark">
            {{ solicitacao.matriculasCount }} Afetada{{ solicitacao.matriculasCount > 1 ? 's' : '' }}
          </span>
        </div>

        <div v-if="solicitacao.duracao || solicitacao.impacto" class="flex flex-col gap-1">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">PERÍODO</span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full font-inconsolata text-label leading-[18px] whitespace-nowrap bg-gray-txt2-dark/15 text-gray-txt2-dark">
            {{ solicitacao.duracao || solicitacao.impacto }}
          </span>
        </div>
      </div>

      <!-- Timeline visual de Período: Início / Final -->
      <div class="flex flex-col gap-1.5 bg-black-bg1/60 rounded-lg py-2.5 px-3.5">
        <div class="flex justify-between items-center font-inconsolata text-[11px] text-gray-txt3-dark uppercase">
          <span>INÍCIO</span>
          <span>FINAL</span>
        </div>

        <div class="flex items-center gap-2">
          <span class="font-inconsolata text-[13px] text-gray-txt2-dark whitespace-nowrap">{{ solicitacao.inicio }}</span>
          <i class="bi bi-fast-forward-circle-fill text-[14px] text-gray-txt3-dark flex items-center" aria-hidden="true" />
          <div class="flex-1 h-[2px] bg-gray-txt3-dark" aria-hidden="true" />
          <i class="bi bi-check-circle-fill text-[14px] text-gray-txt3-dark flex items-center" aria-hidden="true" />
          <span class="font-inconsolata text-[13px] text-gray-txt2-dark whitespace-nowrap">{{ solicitacao.fim }}</span>
        </div>
      </div>

      <!-- Motivo em itálico -->
      <p class="m-0 text-body leading-snug text-white-txt1">
        <em>{{ solicitacao.motivo }}</em>
      </p>
    </div>

    <!-- Rodapé -->
    <footer class="flex justify-between items-center py-2.5 px-4 border-t border-gray-txt3-dark font-inconsolata text-metadata text-white-txt1">
      <span class="whitespace-nowrap">{{ formatarSolicitante(solicitacao.solicitante) }}</span>
      <span class="whitespace-nowrap">Submetido em {{ solicitacao.submetidoEm }}</span>
    </footer>
  </article>
</template>
