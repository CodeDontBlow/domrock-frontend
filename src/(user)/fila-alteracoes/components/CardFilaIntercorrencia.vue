<script setup lang="ts">
import { computed } from 'vue'
import type { SolicitacaoDetalheResponse } from '../services/correcoes'
import type { SolicitacaoIntercorrenciaCard } from '../types'
import {
  formatarData,
  formatarPeriodoIntercorrencia,
  formatarSolicitante,
  rotuloTipo,
} from '../formatacao'

const props = defineProps<{
  solicitacao: SolicitacaoDetalheResponse | SolicitacaoIntercorrenciaCard
  selecionavel?: boolean
}>()

const emit = defineEmits<{
  (e: 'selecionar', solicitacao: SolicitacaoDetalheResponse | SolicitacaoIntercorrenciaCard): void
}>()

const tipoRotulo = computed(() => rotuloTipo(props.solicitacao.tipo))

const matriculaTexto = computed(() => {
  const s = props.solicitacao as SolicitacaoDetalheResponse & SolicitacaoIntercorrenciaCard
  if (s.matricula) return s.matricula
  if (s.matriculas && s.matriculas.length > 0) {
    return s.matriculas.join(', ')
  }
  if (s.matriculasCount) {
    return `${s.matriculasCount} Afetada${s.matriculasCount > 1 ? 's' : ''}`
  }
  return ''
})

const periodoInfo = computed(() => {
  const s = props.solicitacao as SolicitacaoDetalheResponse & SolicitacaoIntercorrenciaCard
  if (s.depois) {
    return formatarPeriodoIntercorrencia(s.tipo, s.depois)
  }
  return {
    inicio: s.inicio || '',
    fim: s.fim || '',
    texto: s.duracao || s.impacto || '',
  }
})

const solicitanteTexto = computed(() => {
  const s = props.solicitacao as SolicitacaoDetalheResponse & SolicitacaoIntercorrenciaCard
  return formatarSolicitante(s.origem, s.autor?.nome || s.solicitante)
})

const dataTexto = computed(() => {
  const s = props.solicitacao as SolicitacaoDetalheResponse & SolicitacaoIntercorrenciaCard
  if (s.submetidoEm) return s.submetidoEm
  if (s.criada_em) return formatarData(s.criada_em)
  return ''
})
</script>

<template>
  <article
    class="w-[389px] min-w-[340px] max-sm:w-full max-sm:min-w-0 shrink-0 flex flex-col justify-between bg-black-bg2 border border-gray-txt3-dark rounded-[10px] font-raleway text-white-txt1 box-border transition-all duration-150 outline-none"
    :class="
      selecionavel
        ? 'cursor-pointer hover:border-blue focus-visible:border-blue focus-visible:-translate-y-0.5'
        : ''
    "
    tabindex="0"
    role="button"
    @click="emit('selecionar', solicitacao)"
    @keydown.enter="emit('selecionar', solicitacao)"
    @keydown.space.prevent="emit('selecionar', solicitacao)"
  >
    <div class="p-4 flex flex-col gap-4">
      <!-- Tags superiores: TIPO, MATRÍCULAS, PERÍODO TEXTO -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex flex-col gap-1">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">TIPO</span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full font-inconsolata text-label leading-[18px] whitespace-nowrap bg-blue/15 text-blue"
          >
            {{ tipoRotulo }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase"
            >MATRÍCULAS</span
          >
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full font-inconsolata text-label leading-[18px] whitespace-nowrap bg-gray-txt2-dark/15 text-gray-txt2-dark"
          >
            {{ matriculaTexto }}
          </span>
        </div>

        <div v-if="periodoInfo.texto" class="flex flex-col gap-1">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase">PERÍODO</span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full font-inconsolata text-label leading-[18px] whitespace-nowrap bg-gray-txt2-dark/15 text-gray-txt2-dark"
          >
            {{ periodoInfo.texto }}
          </span>
        </div>
      </div>

      <!-- Timeline visual de Período: Início / Final -->
      <div
        v-if="periodoInfo.inicio || periodoInfo.fim"
        class="flex flex-col gap-1.5 bg-black-bg1/60 rounded-lg py-2.5 px-3.5"
      >
        <div
          class="flex justify-between items-center font-inconsolata text-[11px] text-gray-txt3-dark uppercase"
        >
          <span>INÍCIO</span>
          <span v-if="periodoInfo.fim">FINAL</span>
        </div>

        <div class="flex items-center gap-2">
          <span class="font-inconsolata text-[13px] text-gray-txt2-dark whitespace-nowrap">{{
            periodoInfo.inicio
          }}</span>
          <template v-if="periodoInfo.fim">
            <i
              class="bi bi-fast-forward-circle-fill text-[14px] text-gray-txt3-dark flex items-center"
              aria-hidden="true"
            />
            <div class="flex-1 h-[2px] bg-gray-txt3-dark" aria-hidden="true" />
            <i
              class="bi bi-check-circle-fill text-[14px] text-gray-txt3-dark flex items-center"
              aria-hidden="true"
            />
            <span class="font-inconsolata text-[13px] text-gray-txt2-dark whitespace-nowrap">{{
              periodoInfo.fim
            }}</span>
          </template>
        </div>
      </div>

      <!-- Motivo em itálico -->
      <p class="m-0 text-body leading-snug text-white-txt1">
        <em>{{ solicitacao.motivo }}</em>
      </p>
    </div>

    <!-- Rodapé -->
    <footer
      class="flex flex-wrap justify-between items-center gap-x-4 gap-y-1 py-2.5 px-4 border-t border-gray-txt3-dark font-inconsolata text-metadata text-white-txt1"
    >
      <span class="whitespace-nowrap">{{ solicitanteTexto }}</span>
      <span v-if="dataTexto" class="whitespace-nowrap">Submetido em {{ dataTexto }}</span>
    </footer>
  </article>
</template>
