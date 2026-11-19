<script setup lang="ts">
import type { SolicitacaoBaseCard } from '../types'

defineProps<{
  solicitacao: SolicitacaoBaseCard
  selecionavel?: boolean
}>()

const emit = defineEmits<{
  (e: 'selecionar', solicitacao: SolicitacaoBaseCard): void
}>()
</script>

<template>
  <article
    class="card-fila-base"
    :class="{ 'card-fila-base--clicavel': selecionavel }"
    tabindex="0"
    role="button"
    @click="emit('selecionar', solicitacao)"
    @keydown.enter="emit('selecionar', solicitacao)"
    @keydown.space.prevent="emit('selecionar', solicitacao)"
  >
    <div class="card-topo">
      <!-- Tags superiores: TIPO, COMPETÊNCIA, MATRÍCULAS -->
      <div class="tags-linha">
        <div class="tag-grupo">
          <span class="tag-rotulo">TIPO</span>
          <span class="selo-pilula selo-pilula--cyan">{{ solicitacao.tipo }}</span>
        </div>

        <div class="tag-grupo">
          <span class="tag-rotulo">COMPETÊNCIA</span>
          <span class="selo-pilula selo-pilula--cyan">{{ solicitacao.competencia }}</span>
        </div>

        <div class="tag-grupo">
          <span class="tag-rotulo">MATRÍCULAS</span>
          <span class="selo-pilula selo-pilula--cinza">
            {{ solicitacao.matriculasCount }} Matrícula{{ solicitacao.matriculasCount > 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- Motivo em itálico -->
      <p class="motivo-texto">
        <em>{{ solicitacao.motivo }}</em>
      </p>

      <!-- Comparativo: Anterior -> Após Mudança -->
      <div class="comparativo-bloco">
        <div class="comparativo-item">
          <span class="comparativo-rotulo">VALOR ANTERIOR</span>
          <p class="comparativo-valor">{{ solicitacao.valorAnterior }}</p>
        </div>

        <i class="bi bi-arrow-right comparativo-seta" aria-hidden="true" />

        <div class="comparativo-item">
          <span class="comparativo-rotulo">VALOR APÓS MUDANÇA</span>
          <p class="comparativo-valor">{{ solicitacao.valorAposMudanca }}</p>
        </div>
      </div>
    </div>

    <!-- Rodapé -->
    <footer class="card-rodape">
      <span class="rodape-info">Solicitado por {{ solicitacao.solicitante }}</span>
      <span class="rodape-info">Submetido em {{ solicitacao.submetidoEm }}</span>
    </footer>
  </article>
</template>

<style scoped>
.card-fila-base {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 450px;
  min-width: 380px;
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

.card-fila-base--clicavel {
  cursor: pointer;
}

.card-fila-base--clicavel:hover,
.card-fila-base--clicavel:focus-visible {
  border-color: var(--color-blue);
  transform: translateY(-2px);
}

.card-topo {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.motivo-texto {
  margin: 0;
  font-size: var(--text-body);
  line-height: 1.4;
  color: var(--color-white-txt1);
}

.comparativo-bloco {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  background-color: rgba(20, 20, 22, 0.6);
  border-radius: 8px;
  padding: 10px 12px;
}

.comparativo-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comparativo-rotulo {
  font-family: var(--font-inconsolata);
  font-size: 11px;
  color: var(--color-gray-txt2-dark);
  text-transform: uppercase;
}

.comparativo-valor {
  margin: 0;
  font-family: var(--font-inconsolata);
  font-size: 13px;
  line-height: 1.3;
  color: var(--color-white-txt1);
}

.comparativo-seta {
  font-size: 16px;
  color: var(--color-gray-txt3-dark);
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
  .card-fila-base {
    width: 100%;
    min-width: 0;
  }
}
</style>
