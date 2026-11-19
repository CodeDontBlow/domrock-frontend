<script setup lang="ts">
import type { SolicitacaoIntercorrenciaCard } from '../types'

defineProps<{
  solicitacao: SolicitacaoIntercorrenciaCard
  selecionavel?: boolean
}>()

const emit = defineEmits<{
  (e: 'selecionar', solicitacao: SolicitacaoIntercorrenciaCard): void
}>()
</script>

<template>
  <article
    class="card-fila-intercorrencia"
    :class="{ 'card-fila-intercorrencia--clicavel': selecionavel }"
    tabindex="0"
    role="button"
    @click="emit('selecionar', solicitacao)"
    @keydown.enter="emit('selecionar', solicitacao)"
    @keydown.space.prevent="emit('selecionar', solicitacao)"
  >
    <div class="card-topo">
      <!-- Tags superiores: TIPO, MATRÍCULAS, STATUS/IMPACTO -->
      <div class="tags-linha">
        <div class="tag-grupo">
          <span class="tag-rotulo">TIPO</span>
          <span class="selo-pilula selo-pilula--cyan">{{ solicitacao.tipo }}</span>
        </div>

        <div class="tag-grupo">
          <span class="tag-rotulo">MATRÍCULAS</span>
          <span class="selo-pilula selo-pilula--cinza">
            {{ solicitacao.matriculasCount }} Matrícula{{ solicitacao.matriculasCount > 1 ? 's' : '' }}
          </span>
        </div>

        <div v-if="solicitacao.impacto" class="tag-grupo">
          <span class="tag-rotulo">IMPACTO</span>
          <span class="selo-pilula selo-pilula--cinza">{{ solicitacao.impacto }}</span>
        </div>
      </div>

      <!-- Timeline visual de Período: Início / Final -->
      <div class="periodo-timeline-bloco">
        <div class="timeline-cabecalho">
          <span class="timeline-rotulo">INÍCIO</span>
          <span class="timeline-rotulo">FINAL</span>
        </div>

        <div class="timeline-linha">
          <span class="timeline-data">{{ solicitacao.inicio }}</span>
          <i class="bi bi-fast-forward-circle-fill timeline-icone" aria-hidden="true" />
          <div class="timeline-trilha" aria-hidden="true" />
          <i class="bi bi-check-circle-fill timeline-icone" aria-hidden="true" />
          <span class="timeline-data">{{ solicitacao.fim }}</span>
        </div>
      </div>

      <!-- Motivo em itálico -->
      <p class="motivo-texto">
        <em>{{ solicitacao.motivo }}</em>
      </p>
    </div>

    <!-- Rodapé -->
    <footer class="card-rodape">
      <span class="rodape-info">Solicitado por {{ solicitacao.solicitante }}</span>
      <span class="rodape-info">Submetido em {{ solicitacao.submetidoEm }}</span>
    </footer>
  </article>
</template>

<style scoped>
.card-fila-intercorrencia {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 389px;
  min-width: 340px;
  flex-shrink: 0;
  background-color: var(--color-black-bg2);
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 10px;
  font-family: var(--font-raleway);
  color: var(--color-white-txt1);
  box-sizing: border-box;
  transition: border-color 0.15s ease, transform 0.15s ease;
  outline: none;
}

.card-fila-intercorrencia--clicavel {
  cursor: pointer;
}

.card-fila-intercorrencia--clicavel:hover,
.card-fila-intercorrencia--clicavel:focus-visible {
  border-color: var(--color-blue);
  transform: translateY(-2px);
}

.card-topo {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tags-linha {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tag-grupo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag-rotulo {
  font-family: var(--font-inconsolata);
  font-size: var(--text-metadata);
  color: var(--color-gray-txt2-dark);
  text-transform: uppercase;
}

.selo-pilula {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  line-height: 18px;
  white-space: nowrap;
}

.selo-pilula--cyan {
  background-color: rgba(0, 180, 241, 0.14);
  color: var(--color-blue);
}

.selo-pilula--cinza {
  background-color: rgba(169, 173, 181, 0.14);
  color: var(--color-gray-txt2-dark);
}

.periodo-timeline-bloco {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: rgba(20, 20, 22, 0.6);
  border-radius: 8px;
  padding: 10px 14px;
}

.timeline-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-rotulo {
  font-family: var(--font-inconsolata);
  font-size: 11px;
  color: var(--color-gray-txt3-dark);
  text-transform: uppercase;
}

.timeline-linha {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-data {
  font-family: var(--font-inconsolata);
  font-size: 13px;
  color: var(--color-gray-txt2-dark);
  white-space: nowrap;
}

.timeline-icone {
  font-size: 14px;
  color: var(--color-gray-txt3-dark);
  display: flex;
  align-items: center;
}

.timeline-trilha {
  flex: 1;
  height: 2px;
  background-color: var(--color-gray-txt3-dark);
}

.motivo-texto {
  margin: 0;
  font-size: var(--text-body);
  line-height: 1.4;
  color: var(--color-white-txt1);
}

.card-rodape {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid var(--color-gray-txt3-dark);
  font-family: var(--font-inconsolata);
  font-size: var(--text-metadata);
  color: var(--color-white-txt1);
}

.rodape-info {
  white-space: nowrap;
}

@media (max-width: 480px) {
  .card-fila-intercorrencia {
    width: 100%;
    min-width: 0;
  }
}
</style>
