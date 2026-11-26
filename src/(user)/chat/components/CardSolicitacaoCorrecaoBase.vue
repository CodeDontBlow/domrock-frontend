<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export type StatusSolicitacao = 'rascunho' | 'enviada' | 'aprovada' | 'erro'

export interface SolicitacaoCorrecaoBaseProps {
  antes?: string | null
  depois?: string | null
  antes_rotulo?: string | null
  depois_rotulo?: string | null
  tipo?: string
  tipo_rotulo?: string | null
  matricula?: string
  competencia?: string
  motivo?: string
  status?: StatusSolicitacao | string
  enviada?: boolean
  erro?: string | null
}

const props = withDefaults(defineProps<SolicitacaoCorrecaoBaseProps>(), {
  antes: '',
  depois: '',
  antes_rotulo: '',
  depois_rotulo: '',
  tipo: '',
  tipo_rotulo: '',
  matricula: '',
  competencia: '',
  motivo: '',
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

const valorAnteriorExibicao = computed(() => {
  return props.antes_rotulo || props.antes || ''
})

const valorDepoisExibicao = computed(() => {
  return props.depois_rotulo || props.depois || ''
})

const tipoExibicao = computed(() => {
  return props.tipo_rotulo || props.tipo || ''
})

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

watch(
  () => props.motivo,
  (novo) => {
    motivoEditado.value = novo
    ultimoMotivoEmitido = novo
  },
)

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
    <article
      class="w-full bg-black-bg1 border-2 border-black-bg2 rounded-[20px] p-6 flex flex-col gap-6 box-border"
      aria-labelledby="titulo-solicitacao-base"
    >
      <!-- Cabeçalho -->
      <header class="flex justify-between items-center gap-4">
        <div class="flex items-center gap-2.5">
          <i class="bi bi-database-exclamation text-[20px] text-blue" aria-hidden="true" />
          <h3 id="titulo-solicitacao-base" class="m-0 text-highlight-1 font-medium text-white-txt1">
            Solicitação de Correção de Dados
          </h3>
        </div>

        <div
          class="inline-flex items-center px-2.5 py-[3px] rounded-full bg-blue/15 text-blue font-inconsolata text-metadata font-normal whitespace-nowrap"
        >
          <span>Feito com Lana</span>
        </div>
      </header>

      <!-- Comparação: Valor Anterior vs Valor Após Mudança -->
      <section
        class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4"
        aria-label="Comparação de valores"
      >
        <div class="flex flex-col gap-1">
          <span class="font-inconsolata text-label text-gray-txt3-dark uppercase"
            >VALOR ANTERIOR</span
          >
          <p class="m-0 text-body text-white-txt1">{{ valorAnteriorExibicao }}</p>
        </div>

        <div
          class="flex justify-center items-center text-gray-txt3-dark text-[20px]"
          aria-hidden="true"
        >
          <i class="bi bi-arrow-right hidden sm:block" />
          <i class="bi bi-arrow-down block sm:hidden" />
        </div>

        <div class="flex flex-col gap-1">
          <span class="font-inconsolata text-label text-gray-txt3-dark uppercase"
            >VALOR APÓS MUDANÇA</span
          >
          <p class="m-0 text-body text-white-txt1">{{ valorDepoisExibicao }}</p>
        </div>
      </section>

      <hr class="border-0 border-t-2 border-black-bg2 m-0" />

      <!-- Conteúdo detalhado: Tipo, Matrículas, Competência e Motivo -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Coluna da Esquerda: Metadados estruturados -->
        <div class="flex flex-col gap-5">
          <!-- Tipo -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5">
              <i class="bi bi-card-text text-[15px] text-gray-txt3-dark" aria-hidden="true" />
              <span class="font-inconsolata text-label text-gray-txt3-dark uppercase">TIPO</span>
            </div>
            <span class="text-body text-white-txt1">{{ tipoExibicao }}</span>
          </div>

          <!-- Matrícula -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5">
              <i class="bi bi-person-video text-[15px] text-gray-txt3-dark" aria-hidden="true" />
              <span class="font-inconsolata text-label text-gray-txt3-dark uppercase"
                >MATRÍCULA</span
              >
            </div>
            <div class="flex flex-wrap items-center gap-4">
              <span v-if="matricula" class="text-body text-white-txt1 font-inconsolata">
                {{ matricula }}
              </span>
            </div>
          </div>

          <!-- Competência -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5">
              <i class="bi bi-card-text text-[15px] text-gray-txt3-dark" aria-hidden="true" />
              <span class="font-inconsolata text-label text-gray-txt3-dark uppercase"
                >COMPETÊNCIA</span
              >
            </div>
            <span class="text-body text-white-txt1 font-inconsolata">{{ competencia }}</span>
          </div>
        </div>

        <!-- Coluna da Direita: Motivo / Textarea -->
        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-1">
            <span class="text-body text-white-txt1">MOTIVO</span>
            <span class="font-inconsolata text-body text-gray-txt3-dark"
              >Clique na caixa de texto para alterar a descrição</span
            >
          </div>

          <div class="flex flex-col items-end gap-2">
            <textarea
              v-model="motivoEditado"
              rows="4"
              class="w-full box-border min-h-[110px] p-3 bg-black-bg2 rounded-[10px] font-inconsolata text-body text-gray-txt2-dark resize-y focus:outline focus:outline-gray-txt2 focus:text-white-txt1"
              aria-label="Descrição do motivo da correção"
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
        <p class="text-orange text-label m-0">
          Solicitação enviada para a análise dos supervisores!
        </p>
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
          class="btn-acao btn-cancelar flex-1 w-full sm:w-auto py-2 px-5 rounded-full font-raleway text-body font-medium text-center cursor-pointer transition-colors bg-transparent border border-gray-txt2-dark text-gray-txt2-dark hover:bg-white/5 hover:border-white-txt1 hover:text-white-txt1"
          @click="handleCancelar"
        >
          Desistir
        </button>

        <button
          type="button"
          class="btn-acao btn-solicitar flex-1 w-full sm:w-auto py-2 px-5 rounded-full font-raleway text-body font-semibold text-center transition-all bg-blue border border-blue text-black-bg1"
          :class="
            statusEfetivo === 'enviada' || statusEfetivo === 'aprovada'
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:brightness-110'
          "
          :disabled="statusEfetivo === 'enviada' || statusEfetivo === 'aprovada'"
          @click="handleSolicitar"
        >
          Confirmar
        </button>
      </footer>
    </article>
  </div>
</template>
