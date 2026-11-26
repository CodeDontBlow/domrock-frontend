<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePerfil, lerPerfil } from '@/composables/usePerfil'
import type { VisualizacaoFila, SolicitacaoBaseCard, SolicitacaoIntercorrenciaCard } from './types'
import {
  listarFila,
  listarMinhas,
  decidir,
  type SolicitacaoDetalheResponse,
} from './services/correcoes'
import {
  ehIntercorrencia,
  extrairMensagemErroDecisao,
  formatarData,
  formatarPeriodoIntercorrencia,
  rotuloStatus,
  rotuloTipo,
} from './formatacao'
import CardFilaBase from './components/CardFilaBase.vue'
import CardFilaIntercorrencia from './components/CardFilaIntercorrencia.vue'
import CarrosselFila from './components/CarrosselFila.vue'
import TabelaHistoricoSolicitacoes, {
  type ItemTabelaHistorico,
} from './components/TabelaHistoricoSolicitacoes.vue'
import ModalDetalheSolicitacao from './components/ModalDetalheSolicitacao.vue'

const { ehSupervisor, perfil } = usePerfil()
const isSupervisor = computed(
  () => ehSupervisor.value || perfil.value === 'SUPERVISOR' || lerPerfil() === 'SUPERVISOR',
)

// Estado da aba selecionada ('correcao' ou 'intercorrencia')
const visualizacaoAtiva = ref<VisualizacaoFila>('correcao')

// Estados de carregamento e erro
const carregando = ref(true)
const erroCarregamento = ref<string | null>(null)
const decidindo = ref(false)
const erroDecisao = ref<string | null>(null)

// Listas vindas da API
const filaPendentes = ref<SolicitacaoDetalheResponse[]>([])
const minhasSolicitacoes = ref<SolicitacaoDetalheResponse[]>([])

// Item selecionado para exibição do modal de detalhes
const itemSelecionado = ref<
  SolicitacaoDetalheResponse | SolicitacaoBaseCard | SolicitacaoIntercorrenciaCard | null
>(null)

async function carregarDados() {
  carregando.value = true
  erroCarregamento.value = null
  try {
    const promises: [
      Promise<SolicitacaoDetalheResponse[]>,
      Promise<SolicitacaoDetalheResponse[]>?,
    ] = [listarMinhas()]
    if (isSupervisor.value) {
      promises.push(listarFila())
    }
    const [minhas, fila] = await Promise.all(promises)
    minhasSolicitacoes.value = minhas || []
    if (fila) {
      filaPendentes.value = fila
    } else {
      filaPendentes.value = []
    }
  } catch (erro: unknown) {
    const msg = (erro as { response?: { data?: { message?: string } } })?.response?.data?.message
    erroCarregamento.value = msg || 'Erro ao carregar solicitações.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregarDados)

// Separação por tipo / categoria
const filaCorrecao = computed(() =>
  filaPendentes.value.filter((item) => !ehIntercorrencia(item.tipo)),
)

const filaIntercorrencia = computed(() =>
  filaPendentes.value.filter((item) => ehIntercorrencia(item.tipo)),
)

const minhasCorrecao = computed(() =>
  minhasSolicitacoes.value.filter((item) => !ehIntercorrencia(item.tipo)),
)

const minhasIntercorrencia = computed(() =>
  minhasSolicitacoes.value.filter((item) => ehIntercorrencia(item.tipo)),
)

function alternarVisualizacao(tipo: VisualizacaoFila) {
  visualizacaoAtiva.value = tipo
  itemSelecionado.value = null
  erroDecisao.value = null
}

function abrirDetalhes(
  item: SolicitacaoDetalheResponse | SolicitacaoBaseCard | SolicitacaoIntercorrenciaCard,
) {
  itemSelecionado.value = item
  erroDecisao.value = null
}

function abrirDetalhesTabela(linha: ItemTabelaHistorico) {
  const item = minhasSolicitacoes.value.find((m) => String(m.id) === String(linha.id))
  if (item) {
    itemSelecionado.value = item
    erroDecisao.value = null
  }
}

function fecharDetalhes() {
  itemSelecionado.value = null
  erroDecisao.value = null
}

async function aprovarSolicitacao(id: string | number) {
  decidindo.value = true
  erroDecisao.value = null
  try {
    await decidir(id, 'APROVAR')
    fecharDetalhes()
    await carregarDados()
  } catch (erro: unknown) {
    erroDecisao.value = extrairMensagemErroDecisao(erro)
  } finally {
    decidindo.value = false
  }
}

async function reprovarSolicitacao(id: string | number, justificativa: string) {
  decidindo.value = true
  erroDecisao.value = null
  try {
    await decidir(id, 'REPROVAR', justificativa)
    fecharDetalhes()
    await carregarDados()
  } catch (erro: unknown) {
    erroDecisao.value = extrairMensagemErroDecisao(erro)
  } finally {
    decidindo.value = false
  }
}

function formatarLinhaTabela(item: SolicitacaoDetalheResponse): ItemTabelaHistorico {
  const periodoInfo = ehIntercorrencia(item.tipo)
    ? formatarPeriodoIntercorrencia(item.tipo, item.depois).texto
    : undefined

  return {
    id: item.id,
    motivo: item.motivo,
    tipo: rotuloTipo(item.tipo),
    competencia: item.competencia,
    periodo: periodoInfo,
    matriculas: item.matricula,
    status: rotuloStatus(item.status),
    justificativa: item.decisao?.justificativa || '—',
  }
}

const itensTabelaAtual = computed<ItemTabelaHistorico[]>(() => {
  const lista =
    visualizacaoAtiva.value === 'correcao' ? minhasCorrecao.value : minhasIntercorrencia.value
  return lista.map(formatarLinhaTabela)
})
</script>

<template>
  <main class="page text-white-txt1 font-raleway">
    <!-- Seção de Introdução com Título, Abas e Banner Informativo -->
    <section class="intro-section">
      <header class="page-header">
        <h1 class="m-0 font-forum font-normal text-header-1 max-md:text-header-2 leading-none">
          Solicitações de Alteração
        </h1>
      </header>

      <!-- Menu de Abas Superior (Figma 1009:5179 e 1009:5547) -->
      <nav
        class="abas-navegacao flex items-center gap-4 max-sm:gap-2 border-b-2 border-black-bg2"
        aria-label="Visualizações da fila de alterações"
      >
        <button
          type="button"
          class="aba-btn py-2.5 px-5 max-sm:py-2 max-sm:px-3 bg-transparent border-0 border-b-2 -mb-[2px] font-raleway text-body max-sm:text-label cursor-pointer transition-colors duration-150"
          :class="
            visualizacaoAtiva === 'correcao'
              ? 'aba-btn--ativo text-white-txt1 border-b-blue font-semibold'
              : 'text-gray-txt2-dark border-b-transparent hover:text-white-txt1 font-medium'
          "
          :aria-selected="visualizacaoAtiva === 'correcao'"
          @click="alternarVisualizacao('correcao')"
        >
          Correção da Base
        </button>

        <button
          type="button"
          class="aba-btn py-2.5 px-5 max-sm:py-2 max-sm:px-3 bg-transparent border-0 border-b-2 -mb-[2px] font-raleway text-body max-sm:text-label cursor-pointer transition-colors duration-150"
          :class="
            visualizacaoAtiva === 'intercorrencia'
              ? 'aba-btn--ativo text-white-txt1 border-b-blue font-semibold'
              : 'text-gray-txt2-dark border-b-transparent hover:text-white-txt1 font-medium'
          "
          :aria-selected="visualizacaoAtiva === 'intercorrencia'"
          @click="alternarVisualizacao('intercorrencia')"
        >
          Abertura de Intercorrência
        </button>
      </nav>

      <!-- Banner de Aviso/Notificação Informativo (Figma 1009:5180) -->
      <div class="notice-section">
        <aside
          class="aviso-banner flex items-center max-sm:items-start gap-2.5 max-sm:gap-2 w-full min-w-0 py-2.5 px-3.5 box-border rounded-[5px] bg-black-bg2 border-l-[3px] border-l-blue text-white-txt1 font-raleway"
          role="status"
        >
          <p
            v-if="visualizacaoAtiva === 'correcao'"
            class="aviso-texto m-0 text-body max-sm:text-label leading-snug font-normal"
          >
            Você está visualizando as solicitações de
            <strong class="text-blue font-extrabold">Correção da Base</strong>. Para ver as
            intercorrências, navegue pelo menu acima.
          </p>
          <p v-else class="aviso-texto m-0 text-body max-sm:text-label leading-snug font-normal">
            Você está visualizando as solicitações de
            <strong class="text-blue font-extrabold">Abertura de Intercorrência</strong>. Para ver
            as correções da base, navegue pelo menu acima.
          </p>
        </aside>
      </div>
    </section>

    <!-- Estado de Carregamento Geral -->
    <p v-if="carregando" class="estado-fila text-gray-txt2-dark py-6">Carregando solicitações…</p>

    <!-- Estado de Erro de Carga Geral -->
    <div
      v-else-if="erroCarregamento"
      class="estado-fila estado-fila--erro flex flex-col gap-3 py-6"
      role="alert"
    >
      <span class="text-red">{{ erroCarregamento }}</span>
      <button
        type="button"
        class="w-fit px-4 py-2 bg-blue text-black-bg1 font-semibold rounded-full hover:brightness-110 cursor-pointer"
        @click="carregarDados"
      >
        Tentar novamente
      </button>
    </div>

    <template v-else>
      <!-- Seção da Fila de Solicitações Pendentes (Supervisor apenas) -->
      <section v-if="isSupervisor" class="approvals-section">
        <header class="section-header">
          <div class="flex gap-3 items-center">
            <h2
              class="m-0 mb-2 font-extrabold text-header-2 max-sm:text-header-3 leading-tight text-white-txt1"
            >
              {{
                visualizacaoAtiva === 'correcao' ? 'Correção da Base' : 'Abertura de Intercorrência'
              }}
            </h2>
            <p
              class="section-subtitle m-0 mb-1.5 text-body max-sm:text-label font-normal leading-relaxed text-gray-txt2-dark"
            >
              {{
                visualizacaoAtiva === 'correcao'
                  ? 'Correção de dados incorretos ou desatualizados na base de dados.'
                  : 'Solicitações de abertura de intercorrências para análise e aprovação.'
              }}
            </p>
          </div>

          <p
            class="section-description m-0 text-body max-sm:text-label font-normal leading-relaxed text-gray-txt2-dark"
          >
            Clique em uma solicitação para ver mais detalhes, aprovar ou reprovar.
          </p>
        </header>

        <!-- Visualização 1: Correção da Base -->
        <CarrosselFila v-if="visualizacaoAtiva === 'correcao'" :total="filaCorrecao.length">
          <p
            v-if="filaCorrecao.length === 0"
            class="estado-fila flex items-center gap-3 text-body text-gray-txt2-dark m-0 py-6"
          >
            Nenhuma solicitação de correção da base aguardando aprovação.
          </p>
          <CardFilaBase
            v-for="item in filaCorrecao"
            :key="item.id"
            :solicitacao="item"
            :selecionavel="true"
            @selecionar="abrirDetalhes"
          />
        </CarrosselFila>

        <!-- Visualização 2: Abertura de Intercorrência -->
        <CarrosselFila v-else :total="filaIntercorrencia.length">
          <p
            v-if="filaIntercorrencia.length === 0"
            class="estado-fila flex items-center gap-3 text-body text-gray-txt2-dark m-0 py-6"
          >
            Nenhuma solicitação de intercorrência aguardando aprovação.
          </p>
          <CardFilaIntercorrencia
            v-for="item in filaIntercorrencia"
            :key="item.id"
            :solicitacao="item"
            :selecionavel="true"
            @selecionar="abrirDetalhes"
          />
        </CarrosselFila>
      </section>

      <!-- Seção "Meus pedidos" (Gerente e Supervisor) -->
      <section class="campaigns-section meus-pedidos-section">
        <header class="section-header">
          <div class="flex gap-3 items-center mb-5">
            <h2
              class="m-0 mb-2 font-extrabold text-header-2 max-sm:text-header-3 leading-tight text-white-txt1"
            >
              Meus pedidos
            </h2>
            <p
              class="section-subtitle m-0 mb-1.5 text-body max-sm:text-label font-normal leading-relaxed text-gray-txt2-dark"
            >
              Acompanhe as solicitações que você abriu e o status de aprovação.
            </p>
          </div>

          <p
            class="section-description m-0 text-body max-sm:text-label font-normal leading-relaxed text-gray-txt2-dark"
          >
            Clique em uma solicitação na tabela abaixo para ver informações mais detalhadas.
          </p>
        </header>

        <TabelaHistoricoSolicitacoes
          :itens="itensTabelaAtual"
          :tipo-visualizacao="visualizacaoAtiva"
          mensagem-vazia="Nenhum pedido encontrado em Meus pedidos."
          @selecionar="abrirDetalhesTabela"
        />
      </section>
    </template>

    <!-- Modal com detalhes completos da solicitação selecionada -->
    <ModalDetalheSolicitacao
      :solicitacao="itemSelecionado"
      :tipo-visualizacao="visualizacaoAtiva"
      :erro-decisao="erroDecisao"
      :decidindo="decidindo"
      @fechar="fecharDetalhes"
      @aprovar="aprovarSolicitacao"
      @reprovar="reprovarSolicitacao"
    />
  </main>
</template>

<style scoped>
.page {
  width: 100%;
  max-width: 1440px;
  min-width: 0;
  margin: 0 auto;
  padding: 40px 16px 32px;
  box-sizing: border-box;
}

.intro-section {
  margin-bottom: 52px;
}

.page-header {
  margin-bottom: 20px;
}

.abas-navegacao {
  margin-bottom: 20px;
}

.notice-section {
  margin: 0;
}

.approvals-section {
  margin-bottom: 56px;
}

.campaigns-section {
  margin-bottom: 24px;
}

.section-header {
  margin-bottom: 16px;
}

.estado-fila {
  padding: 24px 0;
}

@media (max-width: 1366px) {
  .page {
    padding: 32px 16px 24px;
  }

  .intro-section {
    margin-bottom: 40px;
  }

  .approvals-section {
    margin-bottom: 44px;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 32px 12px 24px;
  }

  .intro-section {
    margin-bottom: 42px;
  }

  .page-header {
    margin-bottom: 16px;
  }

  .approvals-section {
    margin-bottom: 44px;
  }

  .section-header {
    margin-bottom: 14px;
  }
}

@media (max-width: 600px) {
  .page {
    padding: 26px 10px 20px;
  }

  .intro-section {
    margin-bottom: 36px;
  }

  .page-header {
    margin-bottom: 14px;
  }

  .abas-navegacao {
    margin-bottom: 16px;
  }

  .approvals-section {
    margin-bottom: 38px;
  }

  .section-header {
    margin-bottom: 12px;
  }
}
</style>
