<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export type StatusSolicitacao = 'rascunho' | 'enviada' | 'aprovada' | 'erro'

export interface SolicitacaoIntercorrenciaProps {
  tipo?: string
  dataInicio?: string
  dataFim?: string
  matriculas?: string[]
  motivo?: string
  status?: StatusSolicitacao | string
  enviada?: boolean
  erro?: string | null
}

const props = withDefaults(defineProps<SolicitacaoIntercorrenciaProps>(), {
  tipo: 'Licença-Maternidade',
  dataInicio: '17/03/2026',
  dataFim: '16/11/2026',
  matriculas: () => ['MAT-102', 'MAT-63', 'MAT-42'],
  motivo: 'O funcionário da matrícula especificada estará de licença-maternidade durante 8 meses.',
  status: 'rascunho',
  enviada: false,
  erro: null,
})

const emit = defineEmits<{
  (e: 'cancelar'): void
  (e: 'solicitar', motivo: string): void
  (e: 'salvar-motivo', novoMotivo: string): void
}>()

const motivoEditado = ref(props.motivo)
let ultimoMotivoEmitido = props.motivo
const solicitadoLocalmente = ref(false)

const statusEfetivo = computed<'enviada' | 'aprovada' | 'erro' | null>(() => {
  if (props.erro) return 'erro'
  if (props.status === 'erro') return 'erro'
  if (props.status === 'aprovada') return 'aprovada'
  if (props.status === 'enviada' || props.enviada || solicitadoLocalmente.value) return 'enviada'
  return null
})

function salvarMotivo() {
  if (motivoEditado.value !== ultimoMotivoEmitido) {
    ultimoMotivoEmitido = motivoEditado.value
    emit('salvar-motivo', motivoEditado.value)
  }
}

watch(() => props.motivo, (novo) => {
  motivoEditado.value = novo
  ultimoMotivoEmitido = novo
})

watch(motivoEditado, () => {
  salvarMotivo()
})

function handleSolicitar() {
  solicitadoLocalmente.value = true
  emit('solicitar', motivoEditado.value)
}

function handleCancelar() {
  solicitadoLocalmente.value = false
  emit('cancelar')
}
</script>

<template>
  <div class="w-full max-w-[800px] font-raleway text-white-txt1 flex flex-col gap-5">
    <!-- Card de solicitação (Figma 964:3251) -->
    <article
      class="w-full bg-black-bg1 border-2 border-black-bg2 rounded-[20px] p-6 flex flex-col gap-6 box-border"
      aria-labelledby="titulo-solicitacao-intercorrencia"
    >
      <!-- Cabeçalho -->
      <header class="flex justify-between items-center gap-4">
        <div class="flex items-center gap-2.5">
          <i class="bi bi-person-exclamation text-[20px] text-blue" aria-hidden="true" />
          <h3 id="titulo-solicitacao-intercorrencia" class="m-0 text-highlight-1 font-medium text-white-txt1">
            Solicitação de Abertura de Intercorrência
          </h3>
        </div>

        <div class="inline-flex items-center px-2.5 py-[3px] rounded-full bg-blue/15 text-blue font-inconsolata text-metadata font-normal whitespace-nowrap">
          <span>Feito com Lana</span>
        </div>
      </header>

      <!-- Conteúdo detalhado: Tipo, Período, Matrículas e Motivo -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Coluna da Esquerda: Metadados estruturados -->
        <div class="flex flex-col gap-5">
          <!-- Tipo -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5">
              <i class="bi bi-card-text text-[15px] text-gray-txt3-dark" aria-hidden="true" />
              <span class="font-inconsolata text-label text-gray-txt3-dark uppercase">TIPO</span>
            </div>
            <span class="text-body text-white-txt1">{{ tipo }}</span>
          </div>

          <!-- Período: Início e Fim -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5">
              <i class="bi bi-calendar-minus text-[15px] text-gray-txt3-dark" aria-hidden="true" />
              <span class="font-inconsolata text-label text-gray-txt3-dark uppercase">PERÍODO</span>
            </div>
            <div class="flex items-center gap-6">
              <div class="flex flex-col gap-0.5">
                <span class="font-inconsolata text-metadata text-gray-txt2-dark">Início</span>
                <span class="text-body text-white-txt1 font-inconsolata">{{ dataInicio }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="font-inconsolata text-metadata text-gray-txt2-dark">Fim</span>
                <span class="text-body text-white-txt1 font-inconsolata">{{ dataFim }}</span>
              </div>
            </div>
          </div>

          <!-- Matrículas -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5">
              <i class="bi bi-person-video text-[15px] text-gray-txt3-dark" aria-hidden="true" />
              <span class="font-inconsolata text-label text-gray-txt3-dark uppercase">MATRÍCULAS</span>
            </div>
            <div class="flex flex-wrap items-center gap-4">
              <span
                v-for="matricula in matriculas"
                :key="matricula"
                class="text-body text-white-txt1 font-inconsolata"
              >
                {{ matricula }}
              </span>
            </div>
          </div>
        </div>

        <!-- Coluna da Direita: Motivo / Textarea -->
        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-1">
            <span class="text-body text-white-txt1">MOTIVO</span>
            <span class="font-inconsolata text-label text-gray-txt3-dark">Clique na caixa de texto para alterar a descrição</span>
          </div>

          <div class="flex flex-col items-end gap-2">
            <textarea
              v-model="motivoEditado"
              rows="5"
              class="w-full box-border min-h-[120px] p-3 bg-black-bg2 border border-gray-txt3-dark rounded-[10px] font-inconsolata text-label text-gray-txt2-dark resize-y focus:outline-none focus:border-blue"
              aria-label="Descrição do motivo da intercorrência"
              :disabled="statusEfetivo === 'enviada' || statusEfetivo === 'aprovada'"
              @input="salvarMotivo"
              @change="salvarMotivo"
            />
          </div>
        </div>
      </div>

      <!-- Status da Solicitação (aparece somente depois do usuário pedir para abrir a solicitação) -->
      <div
        v-if="statusEfetivo === 'enviada'"
        class="status-solicitacao status-enviada flex items-center gap-3 bg-black-bg2 px-4 py-1.5 rounded border-l-3 border-orange"
      >
        <i class="bi bi-clock-history text-orange text-[16px]" aria-hidden="true" />
        <p class="text-orange text-label m-0">Solicitação enviada para a análise dos supervisores!</p>
      </div>

      <div
        v-else-if="statusEfetivo === 'aprovada'"
        class="status-solicitacao status-aprovada flex items-center gap-3 bg-black-bg2 px-4 py-1.5 rounded border-l-3 border-blue"
      >
        <i class="bi bi-check-circle-fill text-blue text-[16px]" aria-hidden="true" />
        <p class="text-blue text-label m-0">Solicitação aprovada e aplicada!</p>
      </div>

      <div
        v-else-if="statusEfetivo === 'erro'"
        class="status-solicitacao status-erro flex items-center gap-3 bg-black-bg2 px-4 py-1.5 rounded border-l-3 border-red"
      >
        <i class="bi bi-exclamation-triangle-fill text-red text-[16px]" aria-hidden="true" />
        <p class="text-red text-label m-0">{{ erro || 'Erro ao processar a solicitação.' }}</p>
      </div>

      <!-- Rodapé com Botões de Ação -->
      <footer class="flex flex-col sm:flex-row gap-5 items-center">
        <button
          type="button"
          class="btn-acao btn-cancelar flex-1 w-full sm:w-auto py-3 px-5 rounded-full font-raleway text-body font-medium text-center cursor-pointer transition-colors bg-transparent border border-gray-txt2-dark text-gray-txt2-dark hover:bg-white/5 hover:border-white-txt1 hover:text-white-txt1"
          @click="handleCancelar"
        >
          Cancelar Solicitação
        </button>

        <button
          type="button"
          class="btn-acao btn-solicitar flex-1 w-full sm:w-auto py-3 px-5 rounded-full font-raleway text-body font-semibold text-center transition-all bg-blue border border-blue text-black-bg1"
          :class="statusEfetivo === 'enviada' || statusEfetivo === 'aprovada' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'"
          :disabled="statusEfetivo === 'enviada' || statusEfetivo === 'aprovada'"
          @click="handleSolicitar"
        >
          Solicitar Alteração
        </button>
      </footer>
    </article>
  </div>
</template>
