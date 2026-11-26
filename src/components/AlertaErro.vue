<script setup lang="ts">
import { computed } from 'vue'

export type TipoAlerta = 'erro' | 'sucesso' | 'aviso' | 'sucesso_parcial' | 'atencao'

// Alerta de feedback dentro dos modais e telas: Background1, borda e ícone na cor do tipo
// (Verde para sucesso completo, Laranja para aviso/sucesso parcial e Vermelho para erro) e texto em Texto2.
const props = withDefaults(
  defineProps<{
    mensagem?: string
    tipo?: TipoAlerta
  }>(),
  {
    tipo: 'erro',
  },
)

interface EstiloAlerta {
  borda: string
  icone: string
  corIcone: string
}

const ESTILOS: Record<TipoAlerta, EstiloAlerta> = {
  sucesso: {
    borda: 'border-green',
    icone: 'bi bi-check-circle-fill',
    corIcone: 'text-green',
  },
  aviso: {
    borda: 'border-orange',
    icone: 'bi bi-exclamation-triangle',
    corIcone: 'text-orange',
  },
  sucesso_parcial: {
    borda: 'border-orange',
    icone: 'bi bi-exclamation-triangle',
    corIcone: 'text-orange',
  },
  atencao: {
    borda: 'border-orange',
    icone: 'bi bi-exclamation-triangle',
    corIcone: 'text-orange',
  },
  erro: {
    borda: 'border-red',
    icone: 'bi bi-exclamation-triangle',
    corIcone: 'text-red',
  },
}

const visual = computed(() => ESTILOS[props.tipo] ?? ESTILOS.erro)
</script>

<template>
  <div
    role="alert"
    class="flex items-start gap-2.5 rounded-[3px] border bg-black-bg1 p-2.5"
    :class="visual.borda"
  >
    <i
      class="text-[15px] leading-4 shrink-0"
      :class="[visual.icone, visual.corIcone]"
      aria-hidden="true"
    ></i>
    <div class="flex-1 font-label text-[14px] text-gray-txt2-dark">
      <slot>{{ mensagem }}</slot>
    </div>
  </div>
</template>
