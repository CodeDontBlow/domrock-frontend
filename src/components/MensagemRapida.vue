<script setup lang="ts">
import { computed } from 'vue'

export type TipoMensagemRapida = 'sucesso' | 'sucesso_parcial' | 'aviso' | 'atencao' | 'erro'

const props = withDefaults(
  defineProps<{
    mensagem: string
    tipo?: TipoMensagemRapida
    titulo?: string
    fechavel?: boolean
  }>(),
  {
    tipo: 'sucesso',
    titulo: '',
    fechavel: true,
  },
)

const emit = defineEmits<{
  fechar: []
}>()

interface ConfiguracaoEstilo {
  container: string
  icone: string
  corIcone: string
  tituloPadrao: string
}

const ESTILOS: Record<TipoMensagemRapida, ConfiguracaoEstilo> = {
  sucesso: {
    container: 'border-green bg-black-bg2 text-white-txt1',
    icone: 'bi bi-check-circle-fill',
    corIcone: 'text-green',
    tituloPadrao: 'Sucesso',
  },
  sucesso_parcial: {
    container: 'border-orange bg-black-bg2 text-white-txt1',
    icone: 'bi bi-exclamation-triangle-fill',
    corIcone: 'text-orange',
    tituloPadrao: 'Sucesso parcial',
  },
  aviso: {
    container: 'border-orange bg-black-bg2 text-white-txt1',
    icone: 'bi bi-exclamation-triangle-fill',
    corIcone: 'text-orange',
    tituloPadrao: 'Atenção',
  },
  atencao: {
    container: 'border-orange bg-black-bg2 text-white-txt1',
    icone: 'bi bi-exclamation-triangle-fill',
    corIcone: 'text-orange',
    tituloPadrao: 'Atenção',
  },
  erro: {
    container: 'border-red bg-black-bg2 text-white-txt1',
    icone: 'bi bi-x-circle-fill',
    corIcone: 'text-red',
    tituloPadrao: 'Erro',
  },
}

const config = computed(() => ESTILOS[props.tipo] ?? ESTILOS.sucesso)
</script>

<template>
  <div
    role="status"
    class="flex items-start gap-3 rounded-[6px] border px-4 py-3 shadow-lg font-raleway transition-all duration-200"
    :class="config.container"
  >
    <i
      class="text-[18px] leading-5 shrink-0"
      :class="[config.icone, config.corIcone]"
      aria-hidden="true"
    ></i>

    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <span v-if="titulo || config.tituloPadrao" class="font-semibold text-[14px] leading-tight">
        {{ titulo || config.tituloPadrao }}
      </span>
      <p class="text-[13px] leading-snug text-gray-txt2-dark break-words">
        {{ mensagem }}
      </p>
    </div>

    <button
      v-if="fechavel"
      type="button"
      class="text-gray-txt3-dark hover:text-white-txt1 shrink-0 cursor-pointer p-0.5 transition-colors"
      aria-label="Fechar notificação"
      @click="emit('fechar')"
    >
      <i class="bi bi-x text-[16px] leading-none" aria-hidden="true"></i>
    </button>
  </div>
</template>
