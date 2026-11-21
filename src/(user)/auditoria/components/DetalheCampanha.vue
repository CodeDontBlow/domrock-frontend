<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { CampanhaDetalhe, VersaoCampanha } from '../../campanha/types'
import type { MensagemGravada } from '../../chat/types'
import { converterHistorico, acharUltimaRegraLana } from '../../chat/reabrir'
import { formatarDataHoraCurta } from '../../chat/formatacao'
import { periodoDaCampanha, valorDoParametro } from '../../campanhas/formatacao'
import EtiquetaStatus from '../../campanhas/components/EtiquetaStatus.vue'
import ResultadoSimulacao from '../../chat/components/ResultadoSimulacao.vue'
import SpeechBubble from '../../chat/components/SpeechBubble.vue'
import FerramentasDropdown from '../../chat/components/FerramentasDropdown.vue'
import { obterServicoAuditoria } from '../services/auditoria'
import { diferencasEntreVersoes, erroConsulta } from '../formatacao'

const servicoAuditoria = obterServicoAuditoria()

const props = defineProps<{ id: number }>()
const campanha = ref<CampanhaDetalhe | null>(null)
const versoes = ref<VersaoCampanha[]>([])
const gravadas = ref<MensagemGravada[]>([])
const carregando = ref(false)
const carregandoVersoes = ref(false)
const carregandoConversa = ref(false)
const erro = ref('')
const erroVersoes = ref('')
const erroConversa = ref('')
const aba = ref<'versoes' | 'decisoes' | 'conversa'>('versoes')
const selecionada = ref<number | null>(null)
const comparar = ref<number | null>(null)
const versao = computed(() => versoes.value.find((v) => v.numero === selecionada.value))
const anterior = computed(() => versoes.value.find((v) => v.numero === comparar.value))
const diferencas = computed(() =>
  anterior.value && versao.value
    ? diferencasEntreVersoes(anterior.value.regra, versao.value.regra)
    : [],
)
const ficha = computed(
  () =>
    versao.value?.regra ??
    (campanha.value?.versoes.length
      ? null
      : (campanha.value?.ultima_simulacao?.regra ?? acharUltimaRegraLana(gravadas.value))),
)
const resultado = computed(
  () =>
    versao.value?.resultado ??
    (campanha.value?.versoes.length ? null : campanha.value?.ultima_simulacao?.resultado),
)
const mensagens = computed(() =>
  converterHistorico(gravadas.value, campanha.value?.ultima_simulacao),
)
const decisoes = computed(() => campanha.value?.versoes.filter((v) => v.decisao) ?? [])
let consulta = 0
watch(selecionada, (numero) => {
  const anteriores = versoes.value.filter((v) => numero !== null && v.numero < numero)
  comparar.value = anteriores[anteriores.length - 1]?.numero ?? null
})
async function carregar() {
  const atual = ++consulta
  campanha.value = null
  versoes.value = []
  gravadas.value = []
  selecionada.value = null
  comparar.value = null
  erro.value = erroVersoes.value = erroConversa.value = ''
  carregando.value = true
  try {
    const detalhe = await servicoAuditoria.abrir(props.id)
    if (atual !== consulta) return
    campanha.value = detalhe
    carregando.value = false
    carregandoVersoes.value = true
    carregandoConversa.value = true
    await Promise.all([
      (async () => {
        const respostas = await Promise.allSettled(
          detalhe.versoes.map((v) => servicoAuditoria.versao(detalhe.id, v.numero)),
        )
        if (atual !== consulta) return
        versoes.value = respostas
          .flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
          .sort((a, b) => a.numero - b.numero)
        if (respostas.some((r) => r.status === 'rejected'))
          erroVersoes.value = 'Não foi possível carregar todas as versões. Tente novamente.'
        selecionada.value = versoes.value[versoes.value.length - 1]?.numero ?? null
        carregandoVersoes.value = false
      })(),
      (async () => {
        try {
          if (detalhe.chat_id) {
            const conversa = await servicoAuditoria.conversa(detalhe.chat_id)
            if (atual === consulta) gravadas.value = conversa.mensagens
          }
        } catch (e) {
          if (atual === consulta) erroConversa.value = erroConsulta(e, 'a conversa')
        } finally {
          if (atual === consulta) carregandoConversa.value = false
        }
      })(),
    ])
  } catch (e) {
    if (atual === consulta) erro.value = erroConsulta(e, 'a campanha')
  } finally {
    if (atual === consulta) carregando.value = false
  }
}
watch(
  () => props.id,
  () => {
    aba.value = 'versoes'
    carregar()
  },
  { immediate: true },
)
onBeforeUnmount(() => ++consulta)
</script>

<template>
  <RouterLink :to="{ name: 'auditoria' }" class="voltar">← Voltar para Auditoria</RouterLink>
  <p v-if="carregando" class="estado" role="status">Carregando campanha…</p>
  <div v-else-if="erro" class="estado erro" role="alert">
    <p>{{ erro }}</p>
    <button type="button" @click="carregar">Tentar novamente</button>
  </div>
  <template v-else-if="campanha">
    <header class="auditoria-cabecalho">
      <div>
        <h1>{{ campanha.nome }}</h1>
        <p>
          {{ campanha.autor.nome ?? 'Autor não informado' }} ·
          {{ periodoDaCampanha(campanha.periodo) }}
        </p>
        <EtiquetaStatus :status="campanha.status" />
      </div>
      <span class="somente-leitura"
        ><i class="bi bi-lock" aria-hidden="true" /> Somente leitura</span
      >
    </header>
    <nav class="abas" aria-label="Detalhes da campanha">
      <button type="button" :aria-pressed="aba === 'versoes'" @click="aba = 'versoes'">
        Versões
      </button>
      <button type="button" :aria-pressed="aba === 'decisoes'" @click="aba = 'decisoes'">
        Decisões
      </button>
      <button type="button" :aria-pressed="aba === 'conversa'" @click="aba = 'conversa'">
        Conversa
      </button>
    </nav>
    <section v-if="aba === 'versoes'" aria-label="Versões e resultados">
      <p v-if="carregandoVersoes" class="estado" role="status">Carregando versões…</p>
      <div v-if="erroVersoes" class="estado erro" role="alert">
        <p>{{ erroVersoes }}</p>
        <button type="button" @click="carregar">Tentar novamente</button>
      </div>
      <div v-if="versoes.length" class="filtros">
        <label
          >Versão<select v-model="selecionada">
            <option v-for="v in versoes" :key="v.numero" :value="v.numero">
              Versão {{ v.numero }}
            </option>
          </select></label
        >
        <label
          >Comparar com<select v-model="comparar">
            <option :value="null">Não comparar</option>
            <option
              v-for="v in versoes.filter((v) => v.numero !== selecionada)"
              :key="v.numero"
              :value="v.numero"
            >
              Versão {{ v.numero }}
            </option>
          </select></label
        >
      </div>
      <p v-else-if="!carregandoVersoes && !campanha.versoes.length" class="estado">
        Esta campanha ainda não possui versões submetidas. A ficha e o resultado abaixo são os
        últimos disponíveis.
      </p>
      <section v-if="anterior && versao" class="comparacao" aria-label="Diferenças entre versões">
        <h2>Diferenças: versão {{ anterior.numero }} → versão {{ versao.numero }}</h2>
        <ul v-if="diferencas.length">
          <li v-for="d in diferencas" :key="d.chave">
            <strong>{{ d.rotulo }}:</strong> {{ d.antes }} <span aria-hidden="true">→</span
            ><span class="sr-only">alterado para</span> <mark>{{ d.depois }}</mark>
          </li>
        </ul>
        <p v-else>Não houve alteração nos parâmetros.</p>
      </section>
      <section v-if="ficha" class="ficha" aria-label="Parâmetros da campanha">
        <h2>Parâmetros {{ versao ? `da versão ${versao.numero}` : 'atuais' }}</h2>
        <dl>
          <div v-for="p in ficha.parametros" :key="p.key">
            <dt>{{ p.label }}</dt>
            <dd>{{ valorDoParametro(p) }}</dd>
          </div>
        </dl>
      </section>
      <p v-else-if="!carregandoVersoes" class="estado">Nenhuma ficha disponível.</p>
      <ResultadoSimulacao v-if="resultado" :resultado="resultado" />
      <p v-else-if="!carregandoVersoes" class="estado">Nenhum resultado de simulação disponível.</p>
      <section v-if="versao?.resimulacao" class="ficha" aria-label="Re-simulação da versão">
        <h2>Re-simulação considerada na decisão</h2>
        <p>
          {{ versao.resimulacao.por.nome }} · {{ formatarDataHoraCurta(versao.resimulacao.em) }}
        </p>
        <ResultadoSimulacao :resultado="versao.resimulacao.resultado" />
      </section>
    </section>
    <section v-else-if="aba === 'decisoes'" aria-label="Decisões da campanha">
      <h2>Decisões</h2>
      <p v-if="!decisoes.length" class="estado">Nenhuma decisão registrada.</p>
      <article v-for="v in decisoes" :key="v.numero" class="decisao">
        <h3>
          Versão {{ v.numero }} — {{ v.decisao?.decisao === 'APROVADA' ? 'Aprovada' : 'Reprovada' }}
        </h3>
        <p>
          Por {{ v.decisao?.por.nome ?? 'Não informado' }} ·
          {{ formatarDataHoraCurta(v.decisao!.em) }}
        </p>
        <p class="justificativa">
          {{ v.decisao?.justificativa ?? 'Sem justificativa registrada' }}
        </p>
      </article>
    </section>
    <section v-else aria-label="Conversa com a Lana">
      <h2>Conversa com a Lana</h2>
      <p v-if="carregandoConversa" class="estado" role="status">Carregando conversa…</p>
      <div v-else-if="erroConversa" class="estado erro" role="alert">
        <p>{{ erroConversa }}</p>
        <button type="button" @click="carregar">Tentar novamente</button>
      </div>
      <p v-else-if="!mensagens.length" class="estado">Nenhuma mensagem registrada.</p>
      <ol v-else class="conversa">
        <li v-for="mensagem in mensagens" :key="mensagem.chave" class="mensagem">
          <p class="mensagem-autor">
            {{
              mensagem.papel === 'agente'
                ? 'Lana'
                : mensagem.papel === 'usuario'
                  ? (campanha.autor.nome ?? 'Usuário')
                  : 'Sistema'
            }}<time v-if="mensagem.criada_em">
              · {{ formatarDataHoraCurta(mensagem.criada_em) }}</time
            >
          </p>
          <FerramentasDropdown v-if="mensagem.events?.length" :events="mensagem.events" />
          <SpeechBubble :message="mensagem.texto" :papel="mensagem.papel" />
        </li>
      </ol>
    </section>
  </template>
</template>
