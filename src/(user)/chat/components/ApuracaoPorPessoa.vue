<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import BotaoTexto from '@/components/BotaoTexto.vue'
import { rotuloAjuste, somarApuracao, totalDaApuracaoConfere } from '../apuracao'
import { formatarMoeda, formatarPercentualFixo } from '../formatacao'
import { rotuloCargo } from '../rotulos'
import type { ApuracaoPessoa } from '../types'

const props = defineProps<{
  linhas?: ApuracaoPessoa[] | null
  totalSimulado: number
}>()

const id = useId()
const loja = ref('')
const cargo = ref('')
const pagina = ref(0)
// Mesmo tamanho e navegação da tabela de usuários.
const ITENS_POR_PAGINA = 10
const todas = computed(() => props.linhas ?? [])
const lojas = computed(() => [...new Set(todas.value.map((p) => p.cod_loja))].sort(ordenarCodigo))
const cargos = computed(() => [...new Set(todas.value.map((p) => p.cod_cargo))].sort(ordenarCodigo))
const filtradas = computed(() =>
  todas.value.filter(
    (p) =>
      (!loja.value || p.cod_loja === loja.value) && (!cargo.value || p.cod_cargo === cargo.value),
  ),
)
const totalPaginas = computed(() => Math.ceil(filtradas.value.length / ITENS_POR_PAGINA))
const visiveis = computed(() =>
  filtradas.value.slice(pagina.value * ITENS_POR_PAGINA, (pagina.value + 1) * ITENS_POR_PAGINA),
)
const total = computed(() => somarApuracao(todas.value))
const subtotal = computed(() => somarApuracao(filtradas.value))
const confere = computed(() => totalDaApuracaoConfere(total.value, props.totalSimulado))

function ordenarCodigo(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { numeric: true })
}

function competencia(valor: string): string {
  const [ano, mes] = valor.split('-')
  return `${mes}/${ano}`
}

watch([loja, cargo], () => {
  pagina.value = 0
})
watch(
  () => props.linhas,
  () => {
    loja.value = ''
    cargo.value = ''
    pagina.value = 0
  },
)
watch(totalPaginas, (quantidade) => {
  pagina.value = Math.min(pagina.value, Math.max(0, quantidade - 1))
})
</script>

<template>
  <section class="apuracao" :aria-labelledby="`${id}-titulo`">
    <h3 :id="`${id}-titulo`">Quanto cada pessoa recebe</h3>
    <p v-if="linhas == null" class="nota">
      O detalhamento por pessoa não está disponível nesta simulação.
    </p>
    <template v-else>
      <p class="nota">
        Uma linha por pessoa e competência. Base e % são os valores da regra base, antes dos
        ajustes. O valor final inclui a campanha e os ajustes calculados pela Lana. Os percentuais
        vigentes no período aparecem no quadro de comissão acima, quando disponíveis.
      </p>
      <div class="filtros">
        <label :for="`${id}-loja`"
          >Loja
          <select :id="`${id}-loja`" v-model="loja">
            <option value="">Todas as lojas</option>
            <option v-for="codigo in lojas" :key="codigo" :value="codigo">Loja {{ codigo }}</option>
          </select>
        </label>
        <label :for="`${id}-cargo`"
          >Cargo
          <select :id="`${id}-cargo`" v-model="cargo">
            <option value="">Todos os cargos</option>
            <option v-for="codigo in cargos" :key="codigo" :value="codigo">
              {{ rotuloCargo(codigo) }}
            </option>
          </select>
        </label>
      </div>
      <p class="nota" role="status">{{ filtradas.length }} de {{ todas.length }} registros</p>
      <div class="tabela-rolagem" tabindex="0" role="region" aria-label="Detalhamento por pessoa">
        <table>
          <caption class="sr-only">
            Quanto cada pessoa recebe com a campanha
          </caption>
          <thead>
            <tr>
              <th scope="col">Matrícula</th>
              <th scope="col">Cargo</th>
              <th scope="col">Loja</th>
              <th scope="col" class="numero">Base</th>
              <th scope="col" class="numero">%</th>
              <th scope="col">Ajustes</th>
              <th scope="col" class="numero">Valor final</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="pessoa in visiveis"
              :key="`${pessoa.matricula}-${pessoa.competencia}-${pessoa.cod_loja}-${pessoa.cod_cargo}-${pessoa.cod_marca}`"
            >
              <th scope="row">
                {{ pessoa.matricula }}
                <small>Competência {{ competencia(pessoa.competencia) }}</small>
              </th>
              <td>{{ rotuloCargo(pessoa.cod_cargo) }}</td>
              <td>{{ pessoa.cod_loja }}</td>
              <td class="numero">{{ formatarMoeda(pessoa.base_calculo) }}</td>
              <td class="numero">{{ formatarPercentualFixo(pessoa.pct_comiss) }}</td>
              <td>
                <ul v-if="pessoa.detalhamento.length" class="ajustes">
                  <li v-for="(ajuste, indice) in pessoa.detalhamento" :key="indice">
                    {{ rotuloAjuste(ajuste) }}
                  </li>
                </ul>
                <span v-else class="nota">Sem ajustes informados</span>
              </td>
              <td class="numero">{{ formatarMoeda(pessoa.comissao_com_campanha) }}</td>
            </tr>
            <tr v-if="!visiveis.length">
              <td colspan="7" class="vazio">
                {{
                  todas.length
                    ? 'Nenhum registro para os filtros selecionados.'
                    : 'Nenhuma pessoa nesta apuração.'
                }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr v-if="loja || cargo" class="subtotal">
              <th scope="row" colspan="6">Subtotal dos filtros (todas as páginas)</th>
              <td class="numero">{{ formatarMoeda(subtotal) }}</td>
            </tr>
            <tr class="total">
              <th scope="row" colspan="6">Total geral com a campanha (sem filtros)</th>
              <td class="numero">{{ formatarMoeda(total) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p v-if="!confere" role="alert" class="divergencia">
        A soma por pessoa ({{ formatarMoeda(total) }}) difere do total “Com a campanha” ({{
          formatarMoeda(totalSimulado)
        }}). Confira o resultado da apuração.
      </p>
      <nav class="paginacao" aria-label="Paginação da apuração por pessoa">
        <span>Página {{ totalPaginas ? pagina + 1 : 0 }} de {{ totalPaginas }}</span>
        <div>
          <BotaoTexto variante="vazado" :disabled="pagina === 0" @click="pagina--"
            >Anterior</BotaoTexto
          >
          <BotaoTexto variante="vazado" :disabled="pagina >= totalPaginas - 1" @click="pagina++"
            >Próxima</BotaoTexto
          >
        </div>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.apuracao {
  min-width: 0;
  margin-top: 20px;
}
h3 {
  font-size: 16px;
  font-weight: 600;
}
.nota,
small {
  color: var(--color-gray-txt2-dark);
  font-size: 12px;
  line-height: 1.5;
}
.nota {
  margin: 8px 0;
}
small {
  display: block;
  white-space: nowrap;
  font-weight: normal;
}
.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
select {
  padding: 8px;
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 5px;
  background: var(--color-black-bg2);
  color: var(--color-white-txt1);
  font: inherit;
}
select:focus-visible,
.tabela-rolagem:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}
.tabela-rolagem {
  overflow-x: auto;
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 5px;
}
table {
  width: 100%;
  min-width: 850px;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}
th,
td {
  padding: 12px;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
  vertical-align: top;
}
thead {
  background: rgb(255 255 255 / 5%);
  color: var(--color-gray-txt2-dark);
}
th {
  font-weight: 500;
}
.numero {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.ajustes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 220px;
  list-style: none;
  padding: 0;
}
.ajustes li {
  padding: 4px 7px;
  border-radius: 5px;
  background: rgb(255 255 255 / 7%);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
tfoot {
  background: rgb(255 255 255 / 4%);
}
.total th,
.total td {
  font-weight: 600;
}
.vazio {
  padding: 24px;
  text-align: center;
}
.divergencia {
  margin-top: 12px;
  color: var(--color-orange);
  font-size: 13px;
}
.paginacao {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  font-size: 14px;
}
.paginacao > div {
  display: flex;
  gap: 10px;
}
</style>
