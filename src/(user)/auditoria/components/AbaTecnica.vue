<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { usePerfil } from '@/composables/usePerfil'
import type { VersaoCampanha } from '../../campanha/types'
import { formatarDataHoraCurta } from '../../chat/formatacao'
import type { PassoTrilha, ResultadoSimulacao } from '../../chat/types'
import TabelaDados from '../../chat/components/TabelaDados.vue'
import {
  erroAlerta,
  motivoBloqueioPasso,
  nomeUsuarioAlerta,
  passoBloqueado,
  passoComBloqueioOuErro,
} from '../formatacao'
import { obterServicoAuditoria } from '../services/auditoria'
import type { AlertaTecnico } from '../types'
import ModalAlertaTecnico from './ModalAlertaTecnico.vue'

const props = defineProps<{
  campanhaId: number
  versao: VersaoCampanha | null
  resultadoFallback?: ResultadoSimulacao | null
}>()

const emit = defineEmits<{
  alertasAtualizados: [numeroVersao: number, alertas: AlertaTecnico[]]
}>()

const { ehAuditor } = usePerfil()
const servicoAuditoria = obterServicoAuditoria()

const passosRecolhidos = ref<Record<number, boolean>>({})
const alertas = ref<AlertaTecnico[]>([])
const carregandoAlertas = ref(false)
const erroCarregarAlertas = ref('')

const modalAberto = ref(false)
const modalModo = ref<'abrir' | 'resolver'>('abrir')
const alertaEmResolucao = ref<AlertaTecnico | null>(null)
const enviandoModal = ref(false)
const erroModal = ref('')

const resultadoAtual = computed(() => props.versao?.resultado ?? props.resultadoFallback ?? null)
const usandoSimulacaoFallback = computed(() => !props.versao && Boolean(props.resultadoFallback))
const passos = computed<PassoTrilha[]>(() => resultadoAtual.value?.trilha?.passos ?? [])
const codigoPython = computed(() => resultadoAtual.value?.codigo?.trim() ?? '')

let consultaAlertas = 0

function estaPassoAberto(index: number): boolean {
  return !passosRecolhidos.value[index]
}

function alternarPasso(index: number): void {
  passosRecolhidos.value[index] = !passosRecolhidos.value[index]
}

function obterIcone(ferramenta: string): string {
  if (ferramenta === 'consultar_banco') return 'bi-database-fill'
  if (ferramenta === 'registrar_parametro_regra' || ferramenta === 'registrar_parametros_regra') {
    return 'bi-sliders2'
  }
  return 'bi-tools'
}

function formatarTempo(tempoMs?: number | null): string {
  if (tempoMs == null || Number.isNaN(tempoMs)) return '0.0s'
  const segundos = Math.max(0, tempoMs) / 1000
  return `${segundos.toFixed(1)}s`
}

async function carregarAlertas(): Promise<void> {
  const atual = ++consultaAlertas
  erroCarregarAlertas.value = ''
  const fallback = props.versao?.alertas
  alertas.value = fallback ? [...fallback] : []

  if (!props.versao) {
    carregandoAlertas.value = false
    return
  }

  carregandoAlertas.value = true
  try {
    const lista = await servicoAuditoria.listarAlertas(props.campanhaId, props.versao.numero)
    if (atual !== consultaAlertas) return
    alertas.value = lista
    emit('alertasAtualizados', props.versao.numero, lista)
  } catch {
    if (atual !== consultaAlertas) return
    erroCarregarAlertas.value = fallback?.length
      ? 'Não foi possível atualizar os alertas agora. Exibindo os dados registrados na versão.'
      : 'Não foi possível carregar os alertas desta versão.'
  } finally {
    if (atual === consultaAlertas) carregandoAlertas.value = false
  }
}

function abrirModalNovo(): void {
  modalModo.value = 'abrir'
  alertaEmResolucao.value = null
  erroModal.value = ''
  modalAberto.value = true
}

function abrirModalResolver(alerta: AlertaTecnico): void {
  modalModo.value = 'resolver'
  alertaEmResolucao.value = alerta
  erroModal.value = ''
  modalAberto.value = true
}

function descartarModal(): void {
  modalAberto.value = false
  erroModal.value = ''
  alertaEmResolucao.value = null
}

function fecharModal(): void {
  if (enviandoModal.value) return
  descartarModal()
}

async function confirmarModal(texto: string): Promise<void> {
  const versao = props.versao
  if (!versao) return
  const campanhaId = props.campanhaId
  const numero = versao.numero
  const base = alertas.value
  const modo = modalModo.value
  const alvo = alertaEmResolucao.value
  enviandoModal.value = true
  erroModal.value = ''

  try {
    let atualizados: AlertaTecnico[] | null = null
    if (modo === 'abrir') {
      const criado = await servicoAuditoria.abrirAlerta(campanhaId, numero, texto)
      atualizados = [criado, ...base.filter((item) => item.id !== criado.id)]
    } else if (alvo) {
      const resolvido = await servicoAuditoria.resolverAlerta(campanhaId, numero, alvo.id, texto)
      atualizados = base.map((item) => (item.id === resolvido.id ? resolvido : item))
    }

    if (atualizados) {
      if (props.campanhaId === campanhaId && props.versao?.numero === numero) {
        alertas.value = atualizados
      }
      if (props.campanhaId === campanhaId) {
        emit('alertasAtualizados', numero, atualizados)
      }
    }
    descartarModal()
  } catch (e) {
    erroModal.value = erroAlerta(e, modo)
  } finally {
    enviandoModal.value = false
  }
}

watch(
  [() => props.campanhaId, () => props.versao?.numero],
  () => {
    passosRecolhidos.value = {}
    if (!enviandoModal.value) descartarModal()
    carregarAlertas()
  },
  { immediate: true },
)

onBeforeUnmount(() => ++consultaAlertas)
</script>

<template>
  <div class="aba-tecnica">
    <p v-if="usandoSimulacaoFallback" class="contagem">
      Sem versão submetida: exibindo a última simulação.
    </p>

    <section class="ficha tecnica-secao" aria-label="Trilha de execução e consultas SQL">
      <div class="tecnica-secao-cabecalho">
        <h2>Trilha com SQLs executados</h2>
        <span v-if="passos.length" class="contagem">
          {{ passos.length }} {{ passos.length === 1 ? 'passo' : 'passos' }}
        </span>
      </div>

      <p v-if="!passos.length" class="estado">
        Nenhum passo de trilha registrado para esta versão.
      </p>

      <div v-else class="flex flex-col rounded-lg border-2 border-black-bg2 overflow-hidden">
        <div
          v-for="(passo, index) in passos"
          :key="`${passo.ordem}-${index}`"
          class="flex flex-col overflow-hidden border-b-2 border-black-bg2 last:border-b-0"
          :class="{ 'passo-bloqueado': passoComBloqueioOuErro(passo) }"
        >
          <button
            type="button"
            class="flex items-center justify-between gap-3 w-full px-3 py-2.5 text-left hover:bg-black-bg1/70 transition-colors cursor-pointer group/tool"
            :aria-expanded="estaPassoAberto(index)"
            @click="alternarPasso(index)"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <i
                class="bi text-[16px] shrink-0"
                :class="[
                  obterIcone(passo.ferramenta),
                  passoComBloqueioOuErro(passo) ? 'text-red' : 'text-blue',
                ]"
                aria-hidden="true"
              ></i>
              <span
                class="text-label text-white-txt1 truncate transition-colors"
                :class="
                  passoComBloqueioOuErro(passo)
                    ? 'group-hover/tool:text-red'
                    : 'group-hover/tool:text-blue'
                "
              >
                {{ passo.descricao || passo.ferramenta }}
              </span>
              <span
                v-if="passoComBloqueioOuErro(passo)"
                class="alerta-badge alerta-badge--bloqueio shrink-0"
              >
                {{ passoBloqueado(passo) ? 'Consulta bloqueada' : 'Erro na consulta' }}
              </span>
              <i
                class="bi bi-chevron-down text-[12px] text-gray-txt3-dark shrink-0 transition-transform duration-200"
                :class="[
                  { 'rotate-180': estaPassoAberto(index) },
                  passoComBloqueioOuErro(passo)
                    ? 'group-hover/tool:text-red'
                    : 'group-hover/tool:text-white-txt1',
                ]"
                aria-hidden="true"
              ></i>
            </div>

            <span class="text-metadata font-inconsolata text-gray-txt3-dark shrink-0 ml-2">
              {{ formatarTempo(passo.tempo_ms) }}
            </span>
          </button>

          <div
            v-if="estaPassoAberto(index)"
            class="flex flex-col gap-3 px-5 py-4 bg-black-bg1/60 text-metadata"
          >
            <div
              v-if="passoComBloqueioOuErro(passo)"
              class="flex items-start gap-2 bg-black-bg2 px-3 py-2 rounded border-l-3 border-red passo-alerta-erro"
              role="note"
            >
              <i
                class="bi bi-exclamation-triangle-fill text-red shrink-0 mt-0.5"
                aria-hidden="true"
              ></i>
              <p class="text-white-txt1 text-label">
                <strong>{{
                  passoBloqueado(passo) ? 'Motivo do bloqueio:' : 'Motivo do erro:'
                }}</strong>
                {{ motivoBloqueioPasso(passo) }}
              </p>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-label text-gray-txt3-dark">Nome da ferramenta:</span>
              <code
                class="px-1.5 py-0.5 rounded bg-black-bg2 text-white-txt1 font-source-code-pro text-code"
              >
                {{ passo.ferramenta }}
              </code>
            </div>

            <div v-if="passo.tabelas_acessadas?.length" class="flex flex-col gap-1.5">
              <span class="text-label text-gray-txt3-dark">Tabelas acessadas:</span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  v-for="tabela in passo.tabelas_acessadas"
                  :key="tabela"
                  class="px-2 py-0.5 rounded bg-black-bg2 font-source-code-pro text-white-txt1 text-label"
                >
                  {{ tabela }}
                </span>
              </div>
            </div>

            <div v-if="passo.competencias?.length" class="flex flex-col gap-1.5">
              <span class="text-label text-gray-txt3-dark">Competências:</span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  v-for="comp in passo.competencias"
                  :key="comp"
                  class="px-2 py-0.5 rounded bg-black-bg2 font-source-code-pro text-white-txt1 text-label"
                >
                  {{ comp }}
                </span>
              </div>
            </div>

            <div
              v-if="passo.registros_retornados !== null && passo.registros_retornados !== undefined"
              class="flex items-center gap-2"
            >
              <span class="text-label text-gray-txt3-dark">Registros retornados:</span>
              <span class="text-white-txt1 font-inconsolata text-label">
                {{ passo.registros_retornados }}
              </span>
            </div>

            <div v-if="passo.sql_executado" class="flex flex-col gap-1">
              <span class="text-label text-gray-txt3-dark">SQL executado:</span>
              <pre
                tabindex="0"
                role="region"
                :aria-label="`SQL executado no passo ${passo.ordem}`"
                class="p-2.5 rounded bg-black-bg2 font-source-code-pro text-code text-white-txt1 overflow-auto whitespace-pre-wrap max-h-48"
              ><code>{{ passo.sql_executado }}</code></pre>
            </div>

            <div v-if="passo.filtros" class="flex flex-col gap-1">
              <span class="text-label text-gray-txt3-dark">Filtros aplicados:</span>
              <pre
                tabindex="0"
                role="region"
                :aria-label="`Filtros aplicados no passo ${passo.ordem}`"
                class="p-2 rounded bg-black-bg2 font-source-code-pro text-label text-gray-txt2-dark overflow-auto whitespace-pre-wrap max-h-36"
              ><code>{{ passo.filtros }}</code></pre>
            </div>

            <div v-if="passo.dados?.length" class="flex flex-col gap-1">
              <span class="text-label text-gray-txt3-dark">Dados retornados:</span>
              <TabelaDados :linhas="passo.dados" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="ficha tecnica-secao" aria-label="Código Python gerado">
      <h2>Código Python gerado</h2>
      <pre
        v-if="codigoPython"
        tabindex="0"
        role="region"
        aria-label="Código Python gerado"
        class="codigo-python p-3 rounded bg-black-bg2 font-source-code-pro text-code text-white-txt1 overflow-auto max-h-96"
      ><code>{{ codigoPython }}</code></pre>
      <p v-else class="estado">Nenhum código Python disponível para esta versão.</p>
    </section>

    <section class="ficha tecnica-secao" aria-label="Alertas técnicos da versão">
      <div class="alertas-cabecalho">
        <div>
          <h2>Alertas técnicos</h2>
          <p v-if="carregandoAlertas && !alertas.length" class="contagem" role="status">
            Carregando alertas…
          </p>
        </div>

        <button
          v-if="ehAuditor && versao"
          type="button"
          class="botao-primario"
          @click="abrirModalNovo"
        >
          <i class="bi bi-exclamation-octagon" aria-hidden="true"></i>
          Abrir alerta
        </button>
      </div>

      <p v-if="erroCarregarAlertas" class="estado erro" role="alert">
        {{ erroCarregarAlertas }}
      </p>
      <p v-if="!carregandoAlertas && !alertas.length && !erroCarregarAlertas" class="estado">
        Nenhum alerta técnico registrado para esta versão.
      </p>

      <ul v-if="alertas.length" class="alertas-lista">
        <li
          v-for="alerta in alertas"
          :key="alerta.id"
          class="alerta-card"
          :class="alerta.status === 'ABERTO' ? 'alerta-card--aberto' : 'alerta-card--resolvido'"
        >
          <div class="alerta-card-topo">
            <div class="alerta-badges">
              <span
                class="alerta-badge"
                :class="
                  alerta.status === 'ABERTO' ? 'alerta-badge--aberto' : 'alerta-badge--resolvido'
                "
              >
                {{ alerta.status }}
              </span>
              <span class="alerta-badge alerta-badge--origem">{{ alerta.origem }}</span>
              <span v-if="alerta.tipo" class="alerta-tipo">{{ alerta.tipo }}</span>
            </div>

            <button
              v-if="ehAuditor && alerta.status === 'ABERTO'"
              type="button"
              class="botao-secundario"
              @click="abrirModalResolver(alerta)"
            >
              Resolver alerta
            </button>
          </div>

          <p class="alerta-descricao">{{ alerta.descricao }}</p>

          <p class="alerta-meta">
            <template v-if="alerta.origem === 'AUTOMATICO' && !alerta.aberto_por">
              Aberto automaticamente
            </template>
            <template v-else>Aberto por {{ nomeUsuarioAlerta(alerta.aberto_por) }}</template>
            <template v-if="alerta.aberto_em">
              · {{ formatarDataHoraCurta(alerta.aberto_em) }}
            </template>
          </p>

          <div
            v-if="
              alerta.status === 'RESOLVIDO' ||
              alerta.resolvido_por ||
              alerta.resolvido_em ||
              alerta.justificativa
            "
            class="alerta-resolucao"
          >
            <p class="alerta-meta">
              Resolvido por {{ nomeUsuarioAlerta(alerta.resolvido_por) }}
              <template v-if="alerta.resolvido_em">
                · {{ formatarDataHoraCurta(alerta.resolvido_em) }}
              </template>
            </p>
            <p v-if="alerta.justificativa" class="justificativa">
              <strong>Justificativa:</strong> {{ alerta.justificativa }}
            </p>
          </div>
        </li>
      </ul>
    </section>

    <ModalAlertaTecnico
      :aberto="modalAberto"
      :modo="modalModo"
      :alerta="alertaEmResolucao"
      :enviando="enviandoModal"
      :erro-api="erroModal"
      @fechar="fecharModal"
      @confirmar="confirmarModal"
    />
  </div>
</template>
