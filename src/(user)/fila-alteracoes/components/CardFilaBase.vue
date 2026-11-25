<script setup lang="ts">
import type { SolicitacaoBaseCard } from '../types'

defineProps<{
  solicitacao: SolicitacaoBaseCard
  selecionavel?: boolean
}>()

const emit = defineEmits<{
  (e: 'selecionar', solicitacao: SolicitacaoBaseCard): void
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
    class="w-[450px] min-w-[380px] max-sm:w-full max-sm:min-w-0 shrink-0 flex flex-col justify-between bg-black-bg2 border border-gray-txt3-dark rounded-[10px] font-raleway text-white-txt1 box-border transition-all duration-150 outline-none"
    :class="selecionavel ? 'cursor-pointer hover:border-blue focus-visible:border-blue focus-visible:-translate-y-0.5' : ''"
    tabindex="0"
    role="button"
    @click="emit('selecionar', solicitacao)"
    @keydown.enter="emit('selecionar', solicitacao)"
    @keydown.space.prevent="emit('selecionar', solicitacao)"
  >
    <div class="p-4 flex flex-col gap-3.5">
      <!-- Tags superiores: TIPO, COMPETÊNCIA, MATRÍCULAS -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex flex-col gap-1">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">TIPO</span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full font-inconsolata text-label leading-[18px] whitespace-nowrap bg-blue/15 text-blue">
            {{ solicitacao.tipo }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">COMPETÊNCIA</span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full font-inconsolata text-label leading-[18px] whitespace-nowrap bg-blue/15 text-blue">
            {{ solicitacao.competencia }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">MATRÍCULAS</span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full font-inconsolata text-label leading-[18px] whitespace-nowrap bg-gray-txt2-dark/15 text-gray-txt2-dark">
            {{ solicitacao.matriculasCount }} Matrícula{{ solicitacao.matriculasCount > 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- Motivo em itálico -->
      <p class="m-0 text-body leading-snug text-white-txt1">
        <em>{{ solicitacao.motivo }}</em>
      </p>

      <!-- Comparativo: Anterior -> Após Mudança -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 bg-black-bg1/60 rounded-lg p-3">
        <div class="flex flex-col gap-0.5">
          <span class="font-inconsolata text-[11px] text-gray-txt2-dark uppercase">VALOR ANTERIOR</span>
          <p class="m-0 font-inconsolata text-[13px] leading-tight text-white-txt1">{{ solicitacao.valorAnterior }}</p>
        </div>

        <i class="bi bi-arrow-right text-[16px] text-gray-txt3-dark" aria-hidden="true" />

        <div class="flex flex-col gap-0.5">
          <span class="font-inconsolata text-[11px] text-gray-txt2-dark uppercase">VALOR APÓS MUDANÇA</span>
          <p class="m-0 font-inconsolata text-[13px] leading-tight text-white-txt1">{{ solicitacao.valorAposMudanca }}</p>
        </div>
      </div>
    </div>

    <!-- Rodapé -->
    <footer class="flex justify-between items-center py-2.5 px-4 border-t border-gray-txt3-dark font-inconsolata text-metadata text-white-txt1">
      <span class="whitespace-nowrap">{{ formatarSolicitante(solicitacao.solicitante) }}</span>
      <span class="whitespace-nowrap">Submetido em {{ solicitacao.submetidoEm }}</span>
    </footer>
  </article>
</template>
