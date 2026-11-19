<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { VisualizacaoFila } from '../types'

export interface ItemTabelaHistorico {
  id: string | number
  motivo: string
  tipo: string
  competencia?: string
  periodo?: string
  matriculas: string
  status: 'Aprovado' | 'Arquivado'
}

const props = withDefaults(
  defineProps<{
    itens: ItemTabelaHistorico[]
    tipoVisualizacao?: VisualizacaoFila
  }>(),
  {
    tipoVisualizacao: 'correcao',
  },
)

const emit = defineEmits<{
  (e: 'selecionar', item: ItemTabelaHistorico): void
}>()

const ordenarPor = ref<'motivo' | 'tipo' | 'data' | 'status'>('data')
const ordem = ref<'crescente' | 'decrescente'>('decrescente')

function alternarOrdem() {
  ordem.value = ordem.value === 'crescente' ? 'decrescente' : 'crescente'
}

const itensOrdenados = computed(() => {
  return [...props.itens].sort((a, b) => {
    let valorA = ''
    let valorB = ''

    if (ordenarPor.value === 'motivo') {
      valorA = a.motivo
      valorB = b.motivo
    } else if (ordenarPor.value === 'tipo') {
      valorA = a.tipo
      valorB = b.tipo
    } else if (ordenarPor.value === 'status') {
      valorA = a.status
      valorB = b.status
    } else {
      // Data / competência ou período
      valorA = (a.competencia || a.periodo || '')
      valorB = (b.competencia || b.periodo || '')
    }

    const comparacao = valorA.localeCompare(valorB, 'pt-BR')
    return ordem.value === 'crescente' ? comparacao : -comparacao
  })
})

// Paginação
const itensPorPagina = 5
const paginaAtual = ref(1)

const totalPaginas = computed(() => {
  return Math.max(1, Math.ceil(itensOrdenados.value.length / itensPorPagina))
})

const itensPaginados = computed(() => {
  const inicio = (paginaAtual.value - 1) * itensPorPagina
  return itensOrdenados.value.slice(inicio, inicio + itensPorPagina)
})

const paginasVisiveis = computed<(number | string)[]>(() => {
  const total = totalPaginas.value
  const atual = paginaAtual.value

  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (atual <= 3) {
    return [1, 2, 3, '...', total]
  }

  if (atual >= total - 2) {
    return [1, '...', total - 2, total - 1, total]
  }

  return [1, '...', atual, '...', total]
})

watch([ordenarPor, ordem, () => props.tipoVisualizacao], () => {
  paginaAtual.value = 1
})

function irParaPagina(pagina: number | string) {
  if (typeof pagina !== 'number') return
  if (pagina >= 1 && pagina <= totalPaginas.value) {
    paginaAtual.value = pagina
  }
}

function paginaAnterior() {
  if (paginaAtual.value > 1) paginaAtual.value--
}

function proximaPagina() {
  if (paginaAtual.value < totalPaginas.value) paginaAtual.value++
}
</script>

<template>
  <div class="tabela-container">
    <!-- Barra de Filtros / Ordenação -->
    <div class="filtros-barra">
      <div class="filtro-campo">
        <label for="ordenar-historico" class="filtro-label">Ordenando por</label>
        <select
          id="ordenar-historico"
          v-model="ordenarPor"
          class="filtro-select"
        >
          <option value="data">
            {{ tipoVisualizacao === 'correcao' ? 'Competência' : 'Período' }}
          </option>
          <option value="motivo">Motivo</option>
          <option value="tipo">Tipo</option>
          <option value="status">Status</option>
        </select>
      </div>

      <div class="filtro-campo">
        <span class="filtro-label">em ordem</span>
        <button
          type="button"
          class="btn-ordem"
          @click="alternarOrdem"
        >
          <i
            class="bi"
            :class="ordem === 'crescente' ? 'bi-sort-up' : 'bi-sort-down'"
            aria-hidden="true"
          />
          <span>{{ ordem === 'crescente' ? 'Crescente' : 'Decrescente' }}</span>
        </button>
      </div>
    </div>

    <!-- Tabela responsiva -->
    <div class="tabela-rolagem">
      <table class="tabela-dados" aria-label="Histórico de Solicitações">
        <thead>
          <tr class="tabela-linha-cabecalho">
            <th scope="col" class="th-coluna th-motivo">
              <div class="cabecalho-conteudo">
                <i class="bi bi-tag" aria-hidden="true" />
                <span>Motivo da Solicitação</span>
              </div>
            </th>

            <th scope="col" class="th-coluna th-tipo">
              <div class="cabecalho-conteudo">
                <i class="bi bi-card-text" aria-hidden="true" />
                <span>Tipo</span>
              </div>
            </th>

            <th scope="col" class="th-coluna th-data">
              <div class="cabecalho-conteudo">
                <i class="bi bi-calendar" aria-hidden="true" />
                <span>{{ tipoVisualizacao === 'correcao' ? 'Competência' : 'Período' }}</span>
              </div>
            </th>

            <th scope="col" class="th-coluna th-matriculas">
              <div class="cabecalho-conteudo">
                <i class="bi bi-person-video" aria-hidden="true" />
                <span>Matrículas</span>
              </div>
            </th>

            <th scope="col" class="th-coluna th-status">
              <div class="cabecalho-conteudo">
                <i class="bi bi-activity" aria-hidden="true" />
                <span>Status</span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in itensPaginados"
            :key="item.id"
            class="tabela-linha-corpo"
            tabindex="0"
            @click="emit('selecionar', item)"
            @keydown.enter="emit('selecionar', item)"
          >
            <td class="td-celula td-motivo">
              {{ item.motivo }}
            </td>

            <td class="td-celula td-tipo">
              {{ item.tipo }}
            </td>

            <td class="td-celula td-data">
              {{ tipoVisualizacao === 'correcao' ? item.competencia : item.periodo }}
            </td>

            <td class="td-celula td-matriculas">
              {{ item.matriculas }}
            </td>

            <td class="td-celula td-status">
              <span
                class="selo-status"
                :class="item.status === 'Aprovado' ? 'selo-status--aprovado' : 'selo-status--arquivado'"
              >
                {{ item.status }}
              </span>
            </td>
          </tr>

          <tr v-if="itensPaginados.length === 0">
            <td colspan="5" class="tabela-vazia">
              Nenhuma solicitação encontrada no histórico.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginação -->
    <nav
      v-if="totalPaginas > 1"
      class="paginacao"
      aria-label="Navegação da tabela de histórico"
    >
      <button
        type="button"
        class="paginacao-btn paginacao-nav"
        :disabled="paginaAtual <= 1"
        @click="paginaAnterior"
      >
        Anterior
      </button>

      <div class="paginacao-paginas">
        <template v-for="(pag, idx) in paginasVisiveis" :key="idx">
          <span v-if="pag === '...'" class="paginacao-reticencias">...</span>
          <button
            v-else
            type="button"
            class="paginacao-btn paginacao-numero"
            :class="{ 'paginacao-numero--ativo': pag === paginaAtual }"
            @click="irParaPagina(pag)"
          >
            {{ pag }}
          </button>
        </template>
      </div>

      <button
        type="button"
        class="paginacao-btn paginacao-nav"
        :disabled="paginaAtual >= totalPaginas"
        @click="proximaPagina"
      >
        Próximo
      </button>
    </nav>
  </div>
</template>

<style scoped>
.tabela-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  font-family: var(--font-raleway);
  color: var(--color-white-txt1);
}

.filtros-barra {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.filtro-campo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filtro-label {
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  color: var(--color-white-txt1);
}

.filtro-select {
  padding: 6px 12px;
  background-color: var(--color-black-bg2);
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 5px;
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  cursor: pointer;
  outline: none;
}

.filtro-select:focus-visible {
  border-color: var(--color-blue);
}

.btn-ordem {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: var(--color-black-bg2);
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 5px;
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  cursor: pointer;
  transition: border-color 0.15s;
}

.btn-ordem:hover {
  border-color: var(--color-blue);
}

.tabela-rolagem {
  width: 100%;
  overflow-x: auto;
}

.tabela-dados {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.tabela-linha-cabecalho {
  border-bottom: 1px solid var(--color-gray-txt3-dark);
}

.th-coluna {
  padding: 12px 16px;
  font-family: var(--font-raleway);
  font-size: var(--text-body);
  font-weight: 700;
  color: var(--color-white-txt1);
  white-space: nowrap;
}

.cabecalho-conteudo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cabecalho-conteudo i {
  color: var(--color-blue);
  font-size: 15px;
}

.tabela-linha-corpo {
  border-bottom: 1px solid var(--color-black-bg2);
  cursor: pointer;
  transition: background-color 0.15s;
  outline: none;
}

.tabela-linha-corpo:hover,
.tabela-linha-corpo:focus-visible {
  background-color: rgba(255, 255, 255, 0.04);
}

.td-celula {
  padding: 14px 16px;
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  color: var(--color-white-txt1);
  vertical-align: middle;
}

.td-motivo {
  font-family: var(--font-raleway);
  font-size: 15px;
  max-width: 400px;
}

.td-tipo,
.td-data,
.td-matriculas {
  white-space: nowrap;
}

.selo-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  border-radius: 999px;
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  font-weight: 500;
  white-space: nowrap;
}

.selo-status--aprovado {
  background-color: rgba(0, 180, 241, 0.14);
  color: var(--color-blue);
}

.selo-status--arquivado {
  background-color: rgba(169, 173, 181, 0.14);
  color: var(--color-gray-txt2-dark);
}

.tabela-vazia {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-gray-txt2-dark);
  font-family: var(--font-raleway);
  font-size: var(--text-body);
}

.paginacao {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.paginacao-btn {
  border: none;
  background-color: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.15s ease;
}

.paginacao-nav {
  padding: 6px 14px;
}

.paginacao-nav:hover:not(:disabled) {
  background-color: #2a2c30;
  color: var(--color-blue);
}

.paginacao-nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.paginacao-paginas {
  display: flex;
  align-items: center;
  gap: 6px;
}

.paginacao-numero {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.paginacao-numero:hover:not(.paginacao-numero--ativo) {
  background-color: #2a2c30;
}

.paginacao-numero--ativo {
  background-color: var(--color-blue);
  color: var(--color-black-bg1);
  font-weight: 700;
}

.paginacao-reticencias {
  color: var(--color-white-txt1);
  padding: 0 4px;
}
</style>
