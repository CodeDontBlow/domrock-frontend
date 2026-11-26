<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SolicitacaoDetalheResponse } from '../services/correcoes'
import type { SolicitacaoBaseCard, SolicitacaoIntercorrenciaCard } from '../types'
import {
  formatarData,
  formatarPeriodoIntercorrencia,
  formatarSolicitante,
  rotuloTipo,
} from '../formatacao'

const props = defineProps<{
  solicitacao:
    SolicitacaoDetalheResponse | SolicitacaoBaseCard | SolicitacaoIntercorrenciaCard | null
  tipoVisualizacao: 'correcao' | 'intercorrencia'
  erroDecisao?: string | null
  decidindo?: boolean
}>()

const emit = defineEmits<{
  (e: 'fechar'): void
  (e: 'aprovar', id: string | number): void
  (e: 'reprovar', id: string | number, justificativa: string): void
}>()

const modalReprovarAberto = ref(false)
const justificativa = ref('')
const erroJustificativa = ref<string | null>(null)

watch(
  () => props.solicitacao,
  () => {
    modalReprovarAberto.value = false
    justificativa.value = ''
    erroJustificativa.value = null
  },
)

const ehBase = computed(() => props.tipoVisualizacao === 'correcao')

const tipoRotulo = computed(() => (props.solicitacao ? rotuloTipo(props.solicitacao.tipo) : ''))

const matriculaTexto = computed(() => {
  if (!props.solicitacao) return ''
  const s = props.solicitacao as SolicitacaoDetalheResponse & SolicitacaoBaseCard
  if (s.matricula) return s.matricula
  if (s.matriculas && s.matriculas.length > 0) return s.matriculas.join(', ')
  return ''
})

const periodoTexto = computed(() => {
  if (!props.solicitacao) return ''
  const s = props.solicitacao as SolicitacaoDetalheResponse & SolicitacaoIntercorrenciaCard
  if (s.depois) {
    return formatarPeriodoIntercorrencia(s.tipo, s.depois).texto
  }
  if (s.inicio && s.fim) {
    return `${s.inicio} até ${s.fim}`
  }
  return s.inicio || s.fim || ''
})

const valorAnteriorTexto = computed(() => {
  if (!props.solicitacao) return '—'
  const s = props.solicitacao as SolicitacaoDetalheResponse & SolicitacaoBaseCard
  if (s.antes !== undefined && s.antes !== null) return String(s.antes)
  return s.valorAnterior || '—'
})

const valorDepoisTexto = computed(() => {
  if (!props.solicitacao) return '—'
  const s = props.solicitacao as SolicitacaoDetalheResponse & SolicitacaoBaseCard
  if (s.depois !== undefined && s.depois !== null) return String(s.depois)
  return s.valorAposMudanca || '—'
})

const solicitanteTexto = computed(() => {
  if (!props.solicitacao) return ''
  const s = props.solicitacao as SolicitacaoDetalheResponse & SolicitacaoBaseCard
  return formatarSolicitante(s.origem, s.autor?.nome || s.solicitante)
})

const dataTexto = computed(() => {
  if (!props.solicitacao) return ''
  const s = props.solicitacao as SolicitacaoDetalheResponse & SolicitacaoBaseCard
  if (s.submetidoEm) return s.submetidoEm
  if (s.criada_em) return formatarData(s.criada_em)
  return ''
})

function abrirModalReprovar() {
  modalReprovarAberto.value = true
  justificativa.value = ''
  erroJustificativa.value = null
}

function fecharModalReprovar() {
  modalReprovarAberto.value = false
  justificativa.value = ''
  erroJustificativa.value = null
}

function confirmarReprovar() {
  if (!justificativa.value.trim()) {
    erroJustificativa.value = 'Justificativa obrigatória para reprovar'
    return
  }
  erroJustificativa.value = null
  emit('reprovar', props.solicitacao!.id, justificativa.value.trim())
}
</script>

<template>
  <div
    v-if="solicitacao"
    class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-detalhe-titulo"
    @click.self="emit('fechar')"
    @keydown.esc="emit('fechar')"
  >
    <div
      class="modal-conteudo w-full max-w-[650px] bg-black-bg1 border-2 border-black-bg2 rounded-2xl p-6 flex flex-col gap-5 text-white-txt1 font-raleway shadow-2xl"
    >
      <header class="modal-header flex justify-between items-center">
        <div class="modal-titulo-bloco flex items-center gap-2.5">
          <i
            class="bi text-[24px] text-blue"
            :class="ehBase ? 'bi-database-exclamation' : 'bi-person-exclamation'"
            aria-hidden="true"
          />
          <h2 id="modal-detalhe-titulo" class="m-0 text-header-3 font-bold">
            {{ ehBase ? 'Detalhes da Correção da Base' : 'Detalhes da Intercorrência' }}
          </h2>
        </div>

        <button
          type="button"
          class="modal-btn-fechar bg-transparent border-0 text-gray-txt2-dark text-[18px] cursor-pointer p-1 transition-colors hover:text-white-txt1"
          aria-label="Fechar modal"
          @click="emit('fechar')"
        >
          <i class="bi bi-x-lg" aria-hidden="true" />
        </button>
      </header>

      <div class="modal-corpo flex flex-col gap-4">
        <!-- Alerta de erro de decisão -->
        <div
          v-if="erroDecisao"
          class="p-3 bg-red/15 border border-red text-red rounded-lg text-body"
          role="alert"
        >
          {{ erroDecisao }}
        </div>

        <!-- Tags / Metadados -->
        <div class="modal-tags flex flex-wrap gap-2.5">
          <span
            class="inline-flex items-center px-3 py-1 rounded-full font-inconsolata text-label bg-blue/15 text-blue"
          >
            Tipo: {{ tipoRotulo }}
          </span>
          <span
            v-if="ehBase && (solicitacao as any).competencia"
            class="inline-flex items-center px-3 py-1 rounded-full font-inconsolata text-label bg-blue/15 text-blue"
          >
            Competência: {{ (solicitacao as any).competencia }}
          </span>
          <span
            v-if="!ehBase && periodoTexto"
            class="inline-flex items-center px-3 py-1 rounded-full font-inconsolata text-label bg-blue/15 text-blue"
          >
            Período: {{ periodoTexto }}
          </span>
          <span
            v-if="matriculaTexto"
            class="inline-flex items-center px-3 py-1 rounded-full font-inconsolata text-label bg-gray-txt2-dark/15 text-gray-txt2-dark"
          >
            Matrícula: {{ matriculaTexto }}
          </span>
        </div>

        <!-- Bloco de Comparação para Correção de Base -->
        <div
          v-if="ehBase"
          class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3 bg-black-bg2 p-3.5 rounded-[10px]"
        >
          <div class="flex flex-col gap-1">
            <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase"
              >VALOR ANTERIOR</span
            >
            <p class="m-0 font-inconsolata text-label text-white-txt1 leading-snug">
              {{ valorAnteriorTexto }}
            </p>
          </div>
          <i
            class="bi bi-arrow-right text-[18px] text-gray-txt3-dark self-center hidden sm:block"
            aria-hidden="true"
          />
          <i
            class="bi bi-arrow-down text-[18px] text-gray-txt3-dark self-center block sm:hidden"
            aria-hidden="true"
          />
          <div class="flex flex-col gap-1">
            <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase"
              >VALOR APÓS MUDANÇA</span
            >
            <p class="m-0 font-inconsolata text-label text-white-txt1 leading-snug">
              {{ valorDepoisTexto }}
            </p>
          </div>
        </div>

        <!-- Descrição / Motivo -->
        <div class="flex flex-col gap-1.5">
          <span class="font-inconsolata text-metadata text-gray-txt2-dark uppercase"
            >MOTIVO DA SOLICITAÇÃO</span
          >
          <p class="m-0 text-body text-white-txt1 leading-relaxed bg-black-bg2 p-3 rounded-lg">
            {{ solicitacao.motivo }}
          </p>
        </div>

        <!-- Informações de Submissão -->
        <div
          class="flex justify-between items-center flex-wrap gap-2 text-gray-txt2-dark font-inconsolata text-metadata pt-1 border-t border-black-bg2"
        >
          <span
            ><strong class="text-white-txt1">{{ solicitanteTexto }}</strong></span
          >
          <span v-if="dataTexto"
            >Data de envio: <strong class="text-white-txt1">{{ dataTexto }}</strong></span
          >
        </div>
      </div>

      <footer class="flex justify-end gap-3 pt-2 border-t border-black-bg2">
        <button
          type="button"
          class="btn-reprovar py-2.5 px-5 rounded-full font-raleway text-label font-medium cursor-pointer transition-colors bg-transparent border border-gray-txt2-dark text-gray-txt2-dark hover:bg-white/5 hover:border-white-txt1 hover:text-white-txt1"
          :disabled="decidindo"
          @click="abrirModalReprovar"
        >
          Reprovar
        </button>

        <button
          type="button"
          class="btn-aprovar py-2.5 px-5 rounded-full font-raleway text-label font-semibold cursor-pointer transition-all bg-blue border border-blue text-black-bg1 hover:brightness-110"
          :disabled="decidindo"
          @click="emit('aprovar', solicitacao.id)"
        >
          Aprovar
        </button>
      </footer>
    </div>

    <!-- Modal de Justificativa para Reprovação -->
    <div
      v-if="modalReprovarAberto"
      class="modal-backdrop-reprovar fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reprovar-titulo"
    >
      <div
        class="modal-reprovar-conteudo w-full max-w-[500px] bg-black-bg1 border border-black-bg2 rounded-xl p-5 flex flex-col gap-4 text-white-txt1 font-raleway shadow-xl"
      >
        <header class="flex justify-between items-center">
          <h3 id="modal-reprovar-titulo" class="m-0 text-header-3 font-bold text-red">
            Reprovar Solicitação
          </h3>
          <button
            type="button"
            class="bg-transparent border-0 text-gray-txt2-dark text-lg cursor-pointer"
            @click="fecharModalReprovar"
          >
            <i class="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <p class="m-0 text-body text-gray-txt2-dark">
          Informe a justificativa para a reprovação desta solicitação:
        </p>

        <div class="flex flex-col gap-1.5">
          <textarea
            v-model="justificativa"
            rows="3"
            class="campo-justificativa w-full box-border p-3 bg-black-bg2 rounded-lg border border-gray-txt3-dark font-inconsolata text-body text-white-txt1 focus:outline-none focus:border-blue resize-y"
            placeholder="Justificativa da reprovação..."
            aria-label="Justificativa da reprovação"
          />
          <span
            v-if="erroJustificativa"
            class="erro-justificativa text-red text-label font-medium"
            role="alert"
          >
            {{ erroJustificativa }}
          </span>
        </div>

        <footer class="flex justify-end gap-3 pt-2 border-t border-black-bg2">
          <button
            type="button"
            class="btn-cancelar-reprovacao py-2 px-4 rounded-full font-raleway text-label font-medium cursor-pointer transition-colors bg-transparent border border-gray-txt2-dark text-gray-txt2-dark hover:text-white-txt1"
            @click="fecharModalReprovar"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-confirmar-reprovacao py-2 px-4 rounded-full font-raleway text-label font-semibold cursor-pointer transition-all bg-red border border-red text-white-txt1 hover:brightness-110"
            @click="confirmarReprovar"
          >
            Confirmar Reprovação
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>
