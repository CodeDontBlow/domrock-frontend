<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  total: number
}>()

const carrosselRef = ref<HTMLElement | null>(null)
const indiceAtual = ref(0)

const posicaoAtual = computed(() => {
  if (props.total === 0) return 0
  return Math.min(indiceAtual.value + 2, props.total)
})

function atualizarPosicao() {
  const elemento = carrosselRef.value
  if (!elemento) return

  const primeiroCard = elemento.children[0] as HTMLElement | null
  if (!primeiroCard) return

  const estilos = window.getComputedStyle(elemento)
  const gap = Number.parseFloat(estilos.columnGap) || 24
  const larguraCard = primeiroCard.offsetWidth + gap

  indiceAtual.value = Math.round(elemento.scrollLeft / larguraCard)
}

function retroceder() {
  const elemento = carrosselRef.value
  if (!elemento || props.total === 0) return

  const primeiroCard = elemento.children[0] as HTMLElement | null
  if (!primeiroCard) return

  const estilos = window.getComputedStyle(elemento)
  const gap = Number.parseFloat(estilos.columnGap) || 24
  const larguraCard = primeiroCard.offsetWidth + gap

  elemento.scrollBy({
    left: -larguraCard,
    behavior: 'smooth',
  })
}

function avancar() {
  const elemento = carrosselRef.value
  if (!elemento || props.total === 0) return

  const primeiroCard = elemento.children[0] as HTMLElement | null
  if (!primeiroCard) return

  const estilos = window.getComputedStyle(elemento)
  const gap = Number.parseFloat(estilos.columnGap) || 24
  const larguraCard = primeiroCard.offsetWidth + gap

  const chegouAoFim =
    elemento.scrollLeft + elemento.clientWidth >= elemento.scrollWidth - 10

  if (chegouAoFim) {
    elemento.scrollTo({
      left: 0,
      behavior: 'smooth',
    })
  } else {
    elemento.scrollBy({
      left: larguraCard,
      behavior: 'smooth',
    })
  }
}
</script>

<template>
  <div class="carrossel-bloco">
    <!-- Mini cabeçalho com contador e setas -->
    <div class="mini-header">
      <div class="info-contador">
        <i class="bi bi-arrows-angle-expand icone-expandir" aria-hidden="true" />
        <span class="texto-contador">
          Visualizando {{ posicaoAtual }}/{{ total }} Solicitações
        </span>
      </div>

      <div v-if="total > 0" class="controles-navegacao">
        <button
          type="button"
          class="btn-seta"
          aria-label="Voltar para a solicitação anterior"
          :disabled="indiceAtual <= 0"
          @click="retroceder"
        >
          <i class="bi bi-chevron-left" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="btn-seta"
          aria-label="Avançar para a próxima solicitação"
          :disabled="indiceAtual >= total - 1"
          @click="avancar"
        >
          <i class="bi bi-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Trilho de cartões com rolagem -->
    <div
      ref="carrosselRef"
      class="trilho-carrossel"
      @scroll.passive="atualizarPosicao"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.carrossel-bloco {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.mini-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-raleway);
}

.info-contador {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-white-txt1);
  font-size: var(--text-body);
}

.icone-expandir {
  font-size: 14px;
  color: var(--color-gray-txt2-dark);
}

.texto-contador {
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
}

.controles-navegacao {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-seta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 50%;
  background: transparent;
  color: var(--color-white-txt1);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-seta:hover:not(:disabled) {
  border-color: var(--color-blue);
  color: var(--color-blue);
  background-color: rgba(0, 180, 241, 0.1);
}

.btn-seta:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.trilho-carrossel {
  display: flex;
  align-items: stretch;
  gap: 24px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 12px;
  -webkit-overflow-scrolling: touch;
}

.trilho-carrossel::-webkit-scrollbar {
  height: 6px;
}

.trilho-carrossel::-webkit-scrollbar-track {
  background: var(--color-black-bg1);
}

.trilho-carrossel::-webkit-scrollbar-thumb {
  background: var(--color-black-bg2);
  border-radius: 3px;
}

.trilho-carrossel::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-txt3-dark);
}
</style>
