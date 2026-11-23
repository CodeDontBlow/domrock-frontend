<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { AlertaTecnico } from '../types'

const props = defineProps<{
  aberto: boolean
  modo: 'abrir' | 'resolver'
  alerta?: AlertaTecnico | null
  enviando?: boolean
  erroApi?: string
}>()

const emit = defineEmits<{
  fechar: []
  confirmar: [texto: string]
}>()

const texto = ref('')
const erroValidacao = ref('')
const dialogo = ref<HTMLElement | null>(null)
const campoTexto = ref<HTMLTextAreaElement | null>(null)
let elementoAnterior: HTMLElement | null = null

const SELETOR_FOCAVEIS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const titulo = computed(() =>
  props.modo === 'abrir' ? 'Abrir alerta técnico' : 'Resolver alerta técnico',
)
const rotuloCampo = computed(() => (props.modo === 'abrir' ? 'Descrição' : 'Justificativa'))
const placeholderCampo = computed(() =>
  props.modo === 'abrir'
    ? 'Descreva o problema técnico encontrado nesta versão…'
    : 'Explique como o alerta foi avaliado ou resolvido…',
)
const textoBotaoConfirmar = computed(() => {
  if (props.modo === 'abrir') return props.enviando ? 'Abrindo…' : 'Abrir alerta'
  return props.enviando ? 'Resolvendo…' : 'Resolver alerta'
})
const idCampo = computed(() =>
  props.modo === 'abrir' ? 'modal-alerta-descricao' : 'modal-alerta-justificativa',
)
const mensagemErro = computed(() => erroValidacao.value || props.erroApi || '')

function obterFocaveis(): HTMLElement[] {
  if (!dialogo.value) return []
  return Array.from(dialogo.value.querySelectorAll<HTMLElement>(SELETOR_FOCAVEIS))
}

function aoPressionarTecla(evento: KeyboardEvent): void {
  if (evento.key === 'Escape' && !props.enviando) {
    emit('fechar')
    return
  }
  if (evento.key !== 'Tab') return
  const focaveis = obterFocaveis()
  if (!focaveis.length) {
    evento.preventDefault()
    return
  }
  const primeiro = focaveis[0]!
  const ultimo = focaveis[focaveis.length - 1]!
  const ativo = document.activeElement as HTMLElement | null

  if (evento.shiftKey) {
    if (!ativo || ativo === primeiro || !dialogo.value?.contains(ativo)) {
      evento.preventDefault()
      ultimo.focus()
    }
  } else if (!ativo || ativo === ultimo || !dialogo.value?.contains(ativo)) {
    evento.preventDefault()
    primeiro.focus()
  }
}

function aoDigitar(): void {
  if (erroValidacao.value) erroValidacao.value = ''
}

function submeter(): void {
  if (props.enviando) return
  const limpo = texto.value.trim()
  if (!limpo) {
    erroValidacao.value =
      props.modo === 'abrir'
        ? 'Informe a descrição do alerta.'
        : 'Informe a justificativa para resolver o alerta.'
    campoTexto.value?.focus()
    return
  }
  erroValidacao.value = ''
  emit('confirmar', limpo)
}

watch(
  () => props.aberto,
  async (aberto, abertoAntes) => {
    if (!aberto) {
      window.removeEventListener('keydown', aoPressionarTecla)
      if (abertoAntes) {
        const alvo = elementoAnterior
        elementoAnterior = null
        await nextTick()
        alvo?.focus()
      }
      return
    }
    elementoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    texto.value = ''
    erroValidacao.value = ''
    window.addEventListener('keydown', aoPressionarTecla)
    await nextTick()
    campoTexto.value?.focus()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', aoPressionarTecla)
  elementoAnterior = null
})
</script>

<template>
  <div v-if="aberto" class="modal-alerta-fundo" @click.self="!enviando && emit('fechar')">
    <div
      ref="dialogo"
      class="modal-alerta"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-alerta-titulo"
    >
      <header class="modal-alerta-cabecalho">
        <h3 id="modal-alerta-titulo">{{ titulo }}</h3>
        <button
          type="button"
          class="modal-alerta-fechar"
          aria-label="Fechar modal"
          :disabled="enviando"
          @click="emit('fechar')"
        >
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </header>

      <p v-if="modo === 'resolver' && alerta" class="modal-alerta-contexto">
        <strong>Alerta #{{ alerta.id }}:</strong> {{ alerta.descricao }}
      </p>

      <form class="modal-alerta-form" novalidate @submit.prevent="submeter">
        <label :for="idCampo">{{ rotuloCampo }}</label>
        <textarea
          :id="idCampo"
          ref="campoTexto"
          v-model="texto"
          rows="4"
          :placeholder="placeholderCampo"
          :disabled="enviando"
          :aria-invalid="Boolean(mensagemErro)"
          :aria-describedby="mensagemErro ? 'modal-alerta-erro' : undefined"
          @input="aoDigitar"
        ></textarea>

        <p v-if="mensagemErro" id="modal-alerta-erro" class="modal-alerta-erro" role="alert">
          <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
          <span>{{ mensagemErro }}</span>
        </p>

        <footer class="modal-alerta-acoes">
          <button
            type="button"
            class="botao-secundario"
            :disabled="enviando"
            @click="emit('fechar')"
          >
            Cancelar
          </button>
          <button type="submit" class="botao-primario" :disabled="enviando">
            {{ textoBotaoConfirmar }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>
