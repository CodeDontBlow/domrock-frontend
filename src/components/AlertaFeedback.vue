<script setup lang="ts">
import AlertaErro, { type TipoAlerta } from './AlertaErro.vue'

defineProps<{
  mensagem?: string
  tipo?: TipoAlerta
}>()
</script>

<template>
  <AlertaErro :mensagem="mensagem" :tipo="tipo">
    <slot />
  </AlertaErro>
</template>
