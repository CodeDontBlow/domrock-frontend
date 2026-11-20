<script setup lang="ts">
import { computed } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { ptBR } from 'date-fns/locale'

// Mês de referência da campanha futura (ADR-006), em "YYYY-MM". Só meses fechados da base:
// de julho de 2025 até o mês anterior ao atual. O tema é o mesmo do CampoPeriodo.
const props = defineProps<{ modelValue: string | null; faltando: boolean; idCampo: string }>()
const emit = defineEmits<{ 'update:modelValue': [valor: string] }>()

interface MesAno {
  month: number
  year: number
}

const PRIMEIRO_MES = new Date(2025, 6, 1)
const hoje = new Date()
const ULTIMO_MES = new Date(hoje.getFullYear(), hoje.getMonth(), 0)

/** Ex.: '2025-11' -> { month: 10, year: 2025 } (o mês do componente começa em 0) */
const mes = computed<MesAno | null>(() => {
  const [ano, mesTexto] = (props.modelValue ?? '').split('-')
  return ano && mesTexto ? { month: Number(mesTexto) - 1, year: Number(ano) } : null
})

function alterar(valor: MesAno | null): void {
  if (!valor) return
  emit('update:modelValue', `${valor.year}-${String(valor.month + 1).padStart(2, '0')}`)
}
</script>

<template>
  <VueDatePicker
    :model-value="mes"
    class="campo-periodo"
    :class="{ 'campo-periodo--faltando': faltando }"
    month-picker
    auto-apply
    dark
    :locale="ptBR"
    :formats="{ input: 'MMM/yyyy' }"
    :min-date="PRIMEIRO_MES"
    :max-date="ULTIMO_MES"
    prevent-min-max-navigation
    :input-attrs="{ id: idCampo, clearable: false }"
    placeholder="Escolha o mês"
    @update:model-value="alterar"
  />
</template>
