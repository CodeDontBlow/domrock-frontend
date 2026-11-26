<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { obterServicoAuditoria } from './services/auditoria'
import { erroConsulta } from './formatacao'
import type { CampanhaAuditoria } from './types'
import type { StatusCampanha } from '../campanha/types'
import { diaDoInstante, periodoDaCampanha } from '../campanhas/formatacao'
import { useStatusCampanha } from '../campanhas/useStatusCampanha'
import EtiquetaStatus from '../campanhas/components/EtiquetaStatus.vue'
import DetalheCampanha from './components/DetalheCampanha.vue'
import CorrecoesBase from './components/CorrecoesBase.vue'
import './auditoria.css'

const servicoAuditoria = obterServicoAuditoria()

const route = useRoute()
const aba = ref<'campanhas' | 'correcoes'>('campanhas')
const campanhas = ref<CampanhaAuditoria[]>([])
const carregando = ref(false)
const erro = ref('')
const busca = ref('')
const status = ref<StatusCampanha | ''>('')
const { descreverStatus } = useStatusCampanha()
const statusDisponiveis: StatusCampanha[] = [
  'RASCUNHO',
  'AGUARDANDO_APROVACAO',
  'APROVADA',
  'REPROVADA',
  'ARQUIVADA',
]
const id = computed(() => Number(route.params.id))
const detalhe = computed(() => route.params.id !== undefined)
const idValido = computed(() => Number.isSafeInteger(id.value) && id.value > 0)
function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}
const filtradas = computed(() =>
  campanhas.value.filter(
    (c) =>
      (!status.value || c.status === status.value) &&
      normalizar(c.nome).includes(normalizar(busca.value.trim())),
  ),
)
let consulta = 0
async function carregar() {
  const atual = ++consulta
  carregando.value = true
  erro.value = ''
  campanhas.value = []
  try {
    const resposta = await servicoAuditoria.listar()
    if (atual === consulta) campanhas.value = resposta
  } catch (e) {
    if (atual === consulta) erro.value = erroConsulta(e, 'as campanhas')
  } finally {
    if (atual === consulta) carregando.value = false
  }
}
watch(
  detalhe,
  (abrindoDetalhe) => {
    ++consulta
    if (!abrindoDetalhe) carregar()
  },
  { immediate: true },
)
onBeforeUnmount(() => ++consulta)
</script>

<template>
  <div class="auditoria">
    <template v-if="detalhe">
      <DetalheCampanha v-if="idValido" :id="id" />
      <div v-else role="alert" class="estado">
        <p>Campanha não encontrada.</p>
        <RouterLink :to="{ name: 'auditoria' }">Voltar para Auditoria</RouterLink>
      </div>
    </template>
    <template v-else>
      <header class="auditoria-cabecalho">
        <div>
          <h1>Auditoria</h1>
          <p>Consulte campanhas e correções da base de todos os usuários.</p>
        </div>
        <span class="somente-leitura"
          ><i class="bi bi-lock" aria-hidden="true" /> Somente leitura</span
        >
      </header>
      <nav class="abas" aria-label="Seções da auditoria">
        <button type="button" :aria-pressed="aba === 'campanhas'" @click="aba = 'campanhas'">
          Campanhas
        </button>
        <button type="button" :aria-pressed="aba === 'correcoes'" @click="aba = 'correcoes'">
          Correções da base
        </button>
      </nav>
      <CorrecoesBase v-if="aba === 'correcoes'" />
      <section v-else aria-label="Campanhas de todos os autores">
        <div class="filtros">
          <label
            >Buscar por nome<input v-model="busca" type="search" placeholder="Nome da campanha"
          /></label>
          <label
            >Status<select v-model="status">
              <option value="">Todos os status</option>
              <option v-for="s in statusDisponiveis" :key="s" :value="s">
                {{ descreverStatus(s).label }}
              </option>
            </select></label
          >
        </div>
        <p v-if="carregando" class="estado" role="status">Carregando campanhas…</p>
        <div v-else-if="erro" class="estado erro" role="alert">
          <p>{{ erro }}</p>
          <button type="button" @click="carregar">Tentar novamente</button>
        </div>
        <template v-else>
          <p class="contagem" role="status">
            {{ filtradas.length }}
            {{ filtradas.length === 1 ? 'campanha encontrada' : 'campanhas encontradas' }}
          </p>
          <div v-if="filtradas.length" class="tabela-wrapper">
            <table>
              <caption class="sr-only">
                Campanhas de todos os autores e status
              </caption>
              <thead>
                <tr>
                  <th scope="col">Campanha</th>
                  <th scope="col">Autor</th>
                  <th scope="col">Status</th>
                  <th scope="col">Período</th>
                  <th scope="col">Última alteração</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="campanha in filtradas" :key="campanha.id">
                  <th scope="row">
                    <RouterLink :to="{ name: 'auditoria-campanha', params: { id: campanha.id } }">{{
                      campanha.nome
                    }}</RouterLink>
                  </th>
                  <td>{{ campanha.autor?.nome ?? 'Autor não informado' }}</td>
                  <td><EtiquetaStatus :status="campanha.status" /></td>
                  <td>{{ periodoDaCampanha(campanha.periodo) }}</td>
                  <td>{{ diaDoInstante(campanha.atualizada_em) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="estado">
            {{
              campanhas.length
                ? 'Nenhuma campanha corresponde aos filtros.'
                : 'Nenhuma campanha registrada.'
            }}
          </p>
        </template>
      </section>
    </template>
  </div>
</template>
