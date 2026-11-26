<script setup lang="ts">
import { computed } from 'vue'
import type { MensagemChat, SolicitacaoCorrecaoChat, SolicitacaoPeriodoDepois } from '../types'
import CardSolicitacaoCorrecaoBase from './CardSolicitacaoCorrecaoBase.vue'
import CardSolicitacaoIntercorrencia from './CardSolicitacaoIntercorrencia.vue'

export interface CartaoPedidoProps {
  solicitacao?: SolicitacaoCorrecaoChat | null
  mensagem?: MensagemChat | null
}

const props = defineProps<CartaoPedidoProps>()

const emit = defineEmits<{
  (e: 'confirmar', motivo: string): void
  (e: 'desistir'): void
  (e: 'salvar-motivo', novoMotivo: string): void
  (e: 'solicitar', motivo: string): void
  (e: 'cancelar'): void
}>()

const pedido = computed<SolicitacaoCorrecaoChat | null>(() => {
  return props.solicitacao ?? props.mensagem?.solicitacao ?? null
})

const ehIntercorrencia = computed<boolean>(() => {
  return pedido.value?.categoria === 'INTERCORRENCIA'
})

const periodoDepois = computed<SolicitacaoPeriodoDepois | null>(() => {
  const d = pedido.value?.depois
  if (d && typeof d === 'object') {
    return d as SolicitacaoPeriodoDepois
  }
  return null
})

const depoisTexto = computed<string>(() => {
  const d = pedido.value?.depois
  return typeof d === 'string' ? d : ''
})

const antesTexto = computed<string>(() => {
  const a = pedido.value?.antes
  return typeof a === 'string' ? a : ''
})

function repassarConfirmar(motivo: string): void {
  emit('confirmar', motivo)
  emit('solicitar', motivo)
}

function repassarDesistir(): void {
  emit('desistir')
  emit('cancelar')
}

function repassarSalvarMotivo(novoMotivo: string): void {
  emit('salvar-motivo', novoMotivo)
}
</script>

<template>
  <div v-if="pedido" class="cartao-pedido-container">
    <CardSolicitacaoIntercorrencia
      v-if="ehIntercorrencia"
      :tipo="pedido.tipo"
      :tipo_rotulo="pedido.tipo_rotulo"
      :depois="periodoDepois"
      :depois_rotulo="pedido.depois_rotulo"
      :matricula="pedido.matricula"
      :motivo="pedido.motivo"
      :status="pedido.status"
      :enviada="pedido.enviada"
      :erro="pedido.erroEnvio"
      @solicitar="repassarConfirmar"
      @cancelar="repassarDesistir"
      @salvar-motivo="repassarSalvarMotivo"
    />
    <CardSolicitacaoCorrecaoBase
      v-else
      :tipo="pedido.tipo"
      :tipo_rotulo="pedido.tipo_rotulo"
      :antes="antesTexto"
      :depois="depoisTexto"
      :antes_rotulo="pedido.antes_rotulo"
      :depois_rotulo="pedido.depois_rotulo"
      :matricula="pedido.matricula"
      :competencia="pedido.competencia"
      :motivo="pedido.motivo"
      :status="pedido.status"
      :enviada="pedido.enviada"
      :erro="pedido.erroEnvio"
      @solicitar="repassarConfirmar"
      @cancelar="repassarDesistir"
      @salvar-motivo="repassarSalvarMotivo"
    />
  </div>
</template>
