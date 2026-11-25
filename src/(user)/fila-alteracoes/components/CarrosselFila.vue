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
  <div class="carrossel-bloco flex flex-col gap-4 w-full">
    <!-- Mini cabeçalho com contador e setas -->
    <div class="mini-header flex justify-between items-center font-raleway">
      <div class="info-contador flex items-center gap-2 text-white-txt1 text-body">
        <span class="texto-contador text-body leading-[20px]">
          Visualizando {{ posicaoAtual }}/{{ total }} Solicitações
        </span>
      </div>

      <div v-if="total > 0" class="controles-navegacao flex items-center gap-2">
        <button
          type="button"
          class="btn-seta flex items-center justify-center w-8 h-8 border border-gray-txt3-dark rounded-full bg-transparent text-white-txt1 cursor-pointer transition-all duration-150 hover:enabled:border-blue hover:enabled:text-blue hover:enabled:bg-blue/10 disabled:opacity-35 disabled:cursor-not-allowed"
          aria-label="Voltar para a solicitação anterior"
          :disabled="indiceAtual <= 0"
          @click="retroceder"
        >
          <i class="bi bi-chevron-left" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="btn-seta flex items-center justify-center w-8 h-8 border border-gray-txt3-dark rounded-full bg-transparent text-white-txt1 cursor-pointer transition-all duration-150 hover:enabled:border-blue hover:enabled:text-blue hover:enabled:bg-blue/10 disabled:opacity-35 disabled:cursor-not-allowed"
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
      class="trilho-carrossel flex items-stretch gap-6 overflow-x-auto scroll-smooth pb-3"
      @scroll.passive="atualizarPosicao"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
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
