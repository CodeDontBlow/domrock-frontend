<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, watch } from 'vue'

export interface ColunaTabela {
  chave: string
  titulo: string
  icone?: string
  ordenavel?: boolean
  rotuloOrdenacao?: string
  align?: 'left' | 'center' | 'right'
  classe?: string
}

const props = withDefaults(
  defineProps<{
    colunas: ColunaTabela[]
    dados: T[]
    itensPorPagina?: number
    chaveId?: string
    colunaOrdenacaoPadrao?: string
    ordemPadrao?: 'crescente' | 'decrescente'
    mensagemVazia?: string
    ariaLabel?: string
    ariaLabelPaginacao?: string
  }>(),
  {
    itensPorPagina: 8,
    chaveId: 'id',
    colunaOrdenacaoPadrao: '',
    ordemPadrao: 'crescente',
    mensagemVazia: 'Nenhum registro encontrado.',
    ariaLabel: 'Tabela de dados',
    ariaLabelPaginacao: 'Paginação',
  },
)

const emit = defineEmits<{
  selecionar: [item: T]
}>()

// Colunas ordenáveis (por padrão, toda coluna é ordenável a menos que ordenavel === false)
const colunasOrdenaveis = computed(() =>
  props.colunas.filter((col) => col.ordenavel !== false),
)

// Coluna ativa no select de "Ordenando por"
const ordenarPor = ref(
  props.colunaOrdenacaoPadrao ||
    colunasOrdenaveis.value[0]?.chave ||
    props.colunas[0]?.chave ||
    '',
)

// Ordem (crescente / decrescente)
const ordem = ref<'crescente' | 'decrescente'>(props.ordemPadrao)

// Paginação
const paginaAtual = ref(1)

function converterData(data: unknown): number {
  if (typeof data !== 'string') return Number.NaN
  const valor = data.trim()

  // DD/MM/AAAA
  const brasileira = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brasileira) {
    const dia = Number(brasileira[1])
    const mes = Number(brasileira[2])
    const ano = Number(brasileira[3])
    return new Date(ano, mes - 1, dia).getTime()
  }

  // AAAA-MM-DD
  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    const ano = Number(iso[1])
    const mes = Number(iso[2])
    const dia = Number(iso[3])
    return new Date(ano, mes - 1, dia).getTime()
  }

  // DD/MM (ex: 17/03)
  const diaMes = valor.match(/^(\d{2})\/(\d{2})$/)
  if (diaMes) {
    const dia = Number(diaMes[1])
    const mes = Number(diaMes[2])
    return new Date(2026, mes - 1, dia).getTime()
  }

  // MM/AAAA (ex: 11/2025)
  const mesAno = valor.match(/^(\d{2})\/(\d{4})$/)
  if (mesAno) {
    const mes = Number(mesAno[1])
    const ano = Number(mesAno[2])
    return new Date(ano, mes - 1, 1).getTime()
  }

  return Number.NaN
}

const dadosOrdenados = computed(() => {
  const chave = ordenarPor.value
  if (!chave) return [...props.dados]

  return [...props.dados].sort((a, b) => {
    const valA = a[chave]
    const valB = b[chave]

    // 1. Tentar comparar como data
    const dataA = converterData(valA)
    const dataB = converterData(valB)
    if (!Number.isNaN(dataA) && !Number.isNaN(dataB)) {
      const diff = dataA - dataB
      return ordem.value === 'crescente' ? diff : -diff
    }

    // 2. Tentar comparar como número (ou percentual como "12,5%")
    const numA =
      typeof valA === 'number'
        ? valA
        : Number.parseFloat(String(valA ?? '').replace('%', '').replace(',', '.'))
    const numB =
      typeof valB === 'number'
        ? valB
        : Number.parseFloat(String(valB ?? '').replace('%', '').replace(',', '.'))
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      const diff = numA - numB
      return ordem.value === 'crescente' ? diff : -diff
    }

    // 3. Comparação alfanumérica em português
    const strA = String(valA ?? '')
    const strB = String(valB ?? '')
    const res = strA.localeCompare(strB, 'pt-BR')
    return ordem.value === 'crescente' ? res : -res
  })
})

const totalPaginas = computed(() => {
  return Math.ceil(dadosOrdenados.value.length / props.itensPorPagina)
})

const dadosPaginados = computed(() => {
  const inicio = (paginaAtual.value - 1) * props.itensPorPagina
  const fim = inicio + props.itensPorPagina
  return dadosOrdenados.value.slice(inicio, fim)
})

const paginasVisiveis = computed<(number | string)[]>(() => {
  const total = totalPaginas.value
  const atual = paginaAtual.value

  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (atual <= 3) {
    return [1, 2, 3, '...', total]
  }

  if (atual >= total - 2) {
    return [1, '...', total - 2, total - 1, total]
  }

  return [1, '...', atual, '...', total]
})

watch([ordenarPor, ordem], () => {
  paginaAtual.value = 1
})

watch(totalPaginas, (total) => {
  if (paginaAtual.value > total) {
    paginaAtual.value = Math.max(1, total)
  }
})

function irParaPagina(pagina: number | string) {
  if (typeof pagina !== 'number') return
  if (pagina < 1 || pagina > totalPaginas.value) return
  paginaAtual.value = pagina
}

function paginaAnterior() {
  if (paginaAtual.value > 1) {
    paginaAtual.value--
  }
}

function proximaPagina() {
  if (paginaAtual.value < totalPaginas.value) {
    paginaAtual.value++
  }
}
</script>

<template>
  <section class="campaign-section w-full min-w-0 text-white-txt1 font-raleway">
    <!-- Header: Filtros de Ordenação -->
    <div class="table-filters flex items-center flex-wrap gap-3 mb-4">
      <div class="filter-group flex items-center gap-2 text-gray-txt2-dark font-inconsolata text-label">
        <label for="ordenar-por">Ordenando por</label>

        <select
          id="ordenar-por"
          v-model="ordenarPor"
          class="filter-select min-h-[36px] py-2 pr-3 pl-2.5 rounded-[5px] outline-none bg-black-bg2 text-white-txt1 font-inconsolata text-label cursor-pointer focus:border-blue border border-transparent"
        >
          <option
            v-for="col in colunasOrdenaveis"
            :key="col.chave"
            :value="col.chave"
            class="bg-black-bg2 text-white-txt1"
          >
            {{ col.rotuloOrdenacao || col.titulo }}
          </option>
        </select>
      </div>

      <div class="filter-group flex items-center gap-2 text-gray-txt2-dark font-inconsolata text-label">
        <label for="ordem">em ordem</label>

        <select
          id="ordem"
          v-model="ordem"
          class="filter-select min-h-[36px] py-2 pr-3 pl-2.5 rounded-[5px] outline-none bg-black-bg2 text-white-txt1 font-inconsolata text-label cursor-pointer focus:border-blue border border-transparent"
        >
          <option value="crescente" class="bg-black-bg2 text-white-txt1">Crescente</option>
          <option value="decrescente" class="bg-black-bg2 text-white-txt1">Decrescente</option>
        </select>
      </div>
    </div>

    <!-- Tabela de Dados -->
    <div class="table-container w-full min-w-0 overflow-x-auto bg-black-bg1 text-white-txt1">
      <table class="campaign-table w-full border-collapse text-left text-body leading-[20px]" :aria-label="ariaLabel">
        <thead>
          <tr>
            <th
              v-for="col in colunas"
              :key="col.chave"
              class="py-3.5 px-3 max-md:p-2.5 border-b border-gray-txt3-dark text-white-txt1 font-extrabold whitespace-nowrap"
              :class="[
                col.align === 'right' ? 'text-right' : '',
                col.classe || '',
              ]"
            >
              <div
                class="th-content flex items-center gap-2"
                :class="{ 'justify-end': col.align === 'right' }"
              >
                <i v-if="col.icone" :class="[col.icone, 'header-icon shrink-0 text-gray-txt2-dark text-[16px] leading-none']"></i>
                <span class="font-raleway font-black">{{ col.titulo }}</span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(item, index) in dadosPaginados"
            :key="item[chaveId] ?? `${paginaAtual}-${index}`"
            class="linha-clicavel border-b border-gray-txt3-dark transition-colors duration-200 hover:bg-white/[0.03] cursor-pointer focus-visible:outline-2 focus-visible:outline-blue focus-visible:-outline-offset-2"
            tabindex="0"
            @click="emit('selecionar', item)"
            @keydown.enter="emit('selecionar', item)"
          >
            <td
              v-for="col in colunas"
              :key="col.chave"
              class="py-4 px-3.5 max-md:p-2.5 overflow-hidden text-ellipsis align-middle whitespace-nowrap text-gray-txt2-dark font-inconsolata text-label leading-[15px]"
              :class="[
                col.align === 'right' ? 'text-right' : '',
                col.classe || '',
              ]"
            >
              <slot
                :name="`cell-${col.chave}`"
                :item="item"
                :valor="item[col.chave]"
                :index="index"
              >
                <slot :name="col.chave" :item="item" :valor="item[col.chave]">
                  {{ item[col.chave] }}
                </slot>
              </slot>
            </td>
          </tr>

          <tr v-if="dadosOrdenados.length === 0">
            <td :colspan="colunas.length" class="empty-state py-6 px-4 text-gray-txt2-dark text-center whitespace-normal">
              {{ mensagemVazia }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginação -->
    <nav
      v-if="totalPaginas > 1"
      class="pagination flex items-center justify-end max-md:justify-center flex-wrap gap-2 max-sm:gap-1 mt-5 px-1 font-inconsolata"
      :aria-label="ariaLabelPaginacao"
    >
      <button
        type="button"
        class="pagination-button navigation-button inline-flex items-center justify-center gap-1.5 min-w-[28px] max-sm:min-w-[26px] h-7 py-0 px-2.75 max-sm:px-1.75 border-0 rounded bg-black-bg2 text-white-txt1 font-inconsolata text-label cursor-pointer transition-colors duration-200 hover:enabled:bg-gray-txt3-dark disabled:opacity-45 disabled:cursor-not-allowed"
        :disabled="paginaAtual === 1"
        @click="paginaAnterior"
      >
        <i class="bi bi-chevron-left"></i>
        <span>Anterior</span>
      </button>

      <div class="pagination-pages flex items-center gap-1.5 max-sm:gap-1">
        <template
          v-for="(pagina, index) in paginasVisiveis"
          :key="`${pagina}-${index}`"
        >
          <span
            v-if="pagina === '...'"
            class="pagination-ellipsis inline-flex items-center justify-center min-w-[14px] text-gray-txt2-dark text-label"
          >
            ...
          </span>

          <button
            v-else
            type="button"
            class="pagination-button page-button inline-flex items-center justify-center gap-1.5 min-w-[28px] max-sm:min-w-[26px] h-7 py-0 px-2.25 max-sm:px-1.75 border-0 rounded font-inconsolata text-label cursor-pointer transition-colors duration-200"
            :class="[
              paginaAtual === pagina
                ? 'active bg-blue text-black-bg2 font-medium'
                : 'bg-black-bg2 text-white-txt1 hover:bg-gray-txt3-dark',
            ]"
            :aria-current="paginaAtual === pagina ? 'page' : undefined"
            @click="irParaPagina(pagina)"
          >
            {{ pagina }}
          </button>
        </template>
      </div>

      <button
        type="button"
        class="pagination-button navigation-button inline-flex items-center justify-center gap-1.5 min-w-[28px] max-sm:min-w-[26px] h-7 py-0 px-2.75 max-sm:px-1.75 border-0 rounded bg-black-bg2 text-white-txt1 font-inconsolata text-label cursor-pointer transition-colors duration-200 hover:enabled:bg-gray-txt3-dark disabled:opacity-45 disabled:cursor-not-allowed"
        :disabled="paginaAtual === totalPaginas"
        @click="proximaPagina"
      >
        <span>Próximo</span>
        <i class="bi bi-chevron-right"></i>
      </button>
    </nav>
  </section>
</template>
