<script setup lang="ts">
import { computed } from 'vue'
import type { SolicitacaoBaseCard, SolicitacaoIntercorrenciaCard } from '../types'

const props = defineProps<{
  solicitacao: SolicitacaoBaseCard | SolicitacaoIntercorrenciaCard | null
  tipoVisualizacao: 'correcao' | 'intercorrencia'
}>()

const emit = defineEmits<{
  (e: 'fechar'): void
  (e: 'aprovar', id: string | number): void
  (e: 'arquivar', id: string | number): void
}>()

const ehBase = computed(() => props.tipoVisualizacao === 'correcao')
const itemBase = computed(() => (ehBase.value ? (props.solicitacao as SolicitacaoBaseCard) : null))
const itemIntercorrencia = computed(() =>
  !ehBase.value ? (props.solicitacao as SolicitacaoIntercorrenciaCard) : null,
)
</script>

<template>
  <div
    v-if="solicitacao"
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-detalhe-titulo"
    @click.self="emit('fechar')"
    @keydown.esc="emit('fechar')"
  >
    <div class="modal-conteudo">
      <header class="modal-header">
        <div class="modal-titulo-bloco">
          <i
            class="bi modal-icone"
            :class="ehBase ? 'bi-database-exclamation' : 'bi-person-exclamation'"
            aria-hidden="true"
          />
          <h2 id="modal-detalhe-titulo" class="modal-titulo">
            {{ ehBase ? 'Detalhes da Correção da Base' : 'Detalhes da Intercorrência' }}
          </h2>
        </div>

        <button
          type="button"
          class="modal-btn-fechar"
          aria-label="Fechar modal"
          @click="emit('fechar')"
        >
          <i class="bi bi-x-lg" aria-hidden="true" />
        </button>
      </header>

      <div class="modal-corpo">
        <!-- Tags / Metadados -->
        <div class="modal-tags">
          <span class="selo selo--cyan">Tipo: {{ solicitacao.tipo }}</span>
          <span v-if="ehBase && itemBase" class="selo selo--cyan">
            Competência: {{ itemBase.competencia }}
          </span>
          <span v-if="!ehBase && itemIntercorrencia" class="selo selo--cyan">
            Período: {{ itemIntercorrencia.inicio }} até {{ itemIntercorrencia.fim }}
          </span>
          <span class="selo selo--cinza">
            Matrículas: {{ solicitacao.matriculas.join(', ') }}
          </span>
        </div>

        <!-- Bloco de Comparação para Correção de Base -->
        <div v-if="ehBase && itemBase" class="modal-comparacao">
          <div class="comparacao-caixa">
            <span class="comparacao-label">VALOR ANTERIOR</span>
            <p class="comparacao-texto">{{ itemBase.valorAnterior }}</p>
          </div>
          <i class="bi bi-arrow-right comparacao-seta" aria-hidden="true" />
          <div class="comparacao-caixa">
            <span class="comparacao-label">VALOR APÓS MUDANÇA</span>
            <p class="comparacao-texto">{{ itemBase.valorAposMudanca }}</p>
          </div>
        </div>

        <!-- Descrição / Motivo -->
        <div class="modal-secao">
          <span class="secao-label">MOTIVO DA SOLICITAÇÃO</span>
          <p class="secao-texto">{{ solicitacao.motivo }}</p>
        </div>

        <!-- Informações de Submissão -->
        <div class="modal-submissao">
          <span>Solicitado por: <strong>{{ solicitacao.solicitante }}</strong></span>
          <span>Data de envio: <strong>{{ solicitacao.submetidoEm }}</strong></span>
        </div>
      </div>

      <footer class="modal-footer">
        <button
          type="button"
          class="btn-modal btn-arquivar"
          @click="emit('arquivar', solicitacao.id)"
        >
          Arquivar Solicitação
        </button>

        <button
          type="button"
          class="btn-modal btn-aprovar"
          @click="emit('aprovar', solicitacao.id)"
        >
          Aprovar Alteração
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 16px;
  backdrop-filter: blur(4px);
}

.modal-conteudo {
  width: 100%;
  max-width: 650px;
  background-color: var(--color-black-bg1);
  border: 2px solid var(--color-black-bg2);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-titulo-bloco {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-icone {
  font-size: 24px;
  color: var(--color-blue);
}

.modal-titulo {
  margin: 0;
  font-size: var(--text-header-3);
  font-weight: 700;
}

.modal-btn-fechar {
  background: transparent;
  border: none;
  color: var(--color-gray-txt2-dark);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  transition: color 0.15s;
}

.modal-btn-fechar:hover {
  color: var(--color-white-txt1);
}

.modal-corpo {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.selo {
  padding: 4px 12px;
  border-radius: 999px;
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
}

.selo--cyan {
  background-color: rgba(0, 180, 241, 0.14);
  color: var(--color-blue);
}

.selo--cinza {
  background-color: rgba(169, 173, 181, 0.14);
  color: var(--color-gray-txt2-dark);
}

.modal-comparacao {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  background-color: var(--color-black-bg2);
  padding: 12px;
  border-radius: 8px;
}

.comparacao-caixa {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comparacao-label {
  font-family: var(--font-inconsolata);
  font-size: 11px;
  color: var(--color-gray-txt3-dark);
  text-transform: uppercase;
}

.comparacao-texto {
  margin: 0;
  font-size: 13px;
  color: var(--color-white-txt1);
}

.comparacao-seta {
  color: var(--color-blue);
  font-size: 18px;
}

.modal-secao {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.secao-label {
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  color: var(--color-gray-txt3-dark);
}

.secao-texto {
  margin: 0;
  font-size: var(--text-body);
  line-height: 1.5;
  color: var(--color-white-txt1);
  background-color: var(--color-black-bg2);
  padding: 12px;
  border-radius: 8px;
}

.modal-submissao {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  color: var(--color-gray-txt2-dark);
  padding-top: 8px;
  border-top: 1px solid var(--color-black-bg2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 10px;
}

.btn-modal {
  padding: 10px 20px;
  border-radius: 999px;
  font-family: var(--font-raleway);
  font-size: var(--text-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-arquivar {
  background: transparent;
  border: 1px solid var(--color-gray-txt2-dark);
  color: var(--color-gray-txt2-dark);
}

.btn-arquivar:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: var(--color-white-txt1);
  color: var(--color-white-txt1);
}

.btn-aprovar {
  background-color: var(--color-blue);
  border: 1px solid var(--color-blue);
  color: var(--color-black-bg1);
  font-weight: 600;
}

.btn-aprovar:hover {
  filter: brightness(1.1);
}
</style>
