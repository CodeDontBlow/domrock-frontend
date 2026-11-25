<script setup lang="ts">
import { ref, computed } from 'vue'
import type {
  VisualizacaoFila,
  SolicitacaoBaseCard,
  SolicitacaoIntercorrenciaCard,
} from './types'
import {
  solicitacoesBaseMock,
  solicitacoesIntercorrenciaMock,
  historicoCorrecaoMock,
  historicoIntercorrenciaMock,
} from './mocks'
import CardFilaBase from './components/CardFilaBase.vue'
import CardFilaIntercorrencia from './components/CardFilaIntercorrencia.vue'
import CarrosselFila from './components/CarrosselFila.vue'
import TabelaHistoricoSolicitacoes, {
  type ItemTabelaHistorico,
} from './components/TabelaHistoricoSolicitacoes.vue'
import ModalDetalheSolicitacao from './components/ModalDetalheSolicitacao.vue'

// Estado da aba selecionada ('correcao' ou 'intercorrencia')
const visualizacaoAtiva = ref<VisualizacaoFila>('correcao')

// Listas de cartões da fila
const filaBase = ref<SolicitacaoBaseCard[]>([...solicitacoesBaseMock])
const filaIntercorrencia = ref<SolicitacaoIntercorrenciaCard[]>([...solicitacoesIntercorrenciaMock])

// Listas do histórico
const historicoBase = ref([...historicoCorrecaoMock])
const historicoIntercorrencia = ref([...historicoIntercorrenciaMock])

// Item selecionado para exibição do modal de detalhes
const itemSelecionado = ref<SolicitacaoBaseCard | SolicitacaoIntercorrenciaCard | null>(null)

function alternarVisualizacao(tipo: VisualizacaoFila) {
  visualizacaoAtiva.value = tipo
  itemSelecionado.value = null
}

function abrirDetalhes(item: SolicitacaoBaseCard | SolicitacaoIntercorrenciaCard) {
  itemSelecionado.value = item
}

function abrirDetalhesTabela(linha: ItemTabelaHistorico) {
  if (visualizacaoAtiva.value === 'correcao') {
    const encontrado = filaBase.value.find((b) => b.id === linha.id)
    if (encontrado) {
      itemSelecionado.value = encontrado
      return
    }
    // Cria item a partir da linha do histórico para visualização
    itemSelecionado.value = {
      id: linha.id,
      tipo: linha.tipo,
      competencia: linha.competencia || '11/2025',
      matriculasCount: linha.matriculas.split(',').length,
      matriculas: linha.matriculas.split(',').map((m) => m.trim()),
      motivo: linha.motivo,
      valorAnterior: 'Valor anterior arquivado na base de dados.',
      valorAposMudanca: 'Valor homologado após processamento.',
      solicitante: 'Sistema',
      submetidoEm: 'Arquivo',
      status: linha.status,
    }
  } else {
    const encontrado = filaIntercorrencia.value.find((i) => i.id === linha.id)
    if (encontrado) {
      itemSelecionado.value = encontrado
      return
    }
    itemSelecionado.value = {
      id: linha.id,
      tipo: linha.tipo,
      matriculasCount: linha.matriculas.split(',').length,
      matriculas: linha.matriculas.split(',').map((m) => m.trim()),
      duracao: 'Resolvido',
      inicio: linha.periodo?.split('-')[0]?.trim() || 'Início',
      fim: linha.periodo?.split('-')[1]?.trim() || 'Fim',
      motivo: linha.motivo,
      solicitante: 'Sistema',
      submetidoEm: 'Arquivo',
      status: linha.status,
    }
  }
}

function fecharDetalhes() {
  itemSelecionado.value = null
}

function aprovarSolicitacao(id: string | number) {
  if (visualizacaoAtiva.value === 'correcao') {
    const item = filaBase.value.find((b) => b.id === id)
    if (item) {
      filaBase.value = filaBase.value.filter((b) => b.id !== id)
      historicoBase.value.unshift({
        id: item.id,
        motivo: item.motivo,
        tipo: item.tipo,
        competencia: item.competencia,
        matriculas: item.matriculas.join(', '),
        status: 'Aprovado',
      })
    }
  } else {
    const item = filaIntercorrencia.value.find((i) => i.id === id)
    if (item) {
      filaIntercorrencia.value = filaIntercorrencia.value.filter((i) => i.id !== id)
      historicoIntercorrencia.value.unshift({
        id: item.id,
        motivo: item.motivo,
        tipo: item.tipo,
        periodo: `${item.inicio} - ${item.fim}`,
        matriculas: item.matriculas.join(', '),
        status: 'Aprovado',
      })
    }
  }

  fecharDetalhes()
}

function arquivarSolicitacao(id: string | number) {
  if (visualizacaoAtiva.value === 'correcao') {
    const item = filaBase.value.find((b) => b.id === id)
    if (item) {
      filaBase.value = filaBase.value.filter((b) => b.id !== id)
      historicoBase.value.unshift({
        id: item.id,
        motivo: item.motivo,
        tipo: item.tipo,
        competencia: item.competencia,
        matriculas: item.matriculas.join(', '),
        status: 'Arquivado',
      })
    }
  } else {
    const item = filaIntercorrencia.value.find((i) => i.id === id)
    if (item) {
      filaIntercorrencia.value = filaIntercorrencia.value.filter((i) => i.id !== id)
      historicoIntercorrencia.value.unshift({
        id: item.id,
        motivo: item.motivo,
        tipo: item.tipo,
        periodo: `${item.inicio} - ${item.fim}`,
        matriculas: item.matriculas.join(', '),
        status: 'Arquivado',
      })
    }
  }

  fecharDetalhes()
}

const itensTabelaAtual = computed<ItemTabelaHistorico[]>(() => {
  if (visualizacaoAtiva.value === 'correcao') {
    return historicoBase.value
  }
  return historicoIntercorrencia.value
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
          <p v-if="visualizacaoAtiva === 'correcao'" class="aviso-texto m-0 text-body max-sm:text-label leading-snug font-normal">
            Você está visualizando as solicitações de <strong class="text-blue font-extrabold">Correção da Base</strong>.
            Para ver as intercorrências, navegue pelo menu acima.
          </p>
          <p v-else class="aviso-texto m-0 text-body max-sm:text-label leading-snug font-normal">
            Você está visualizando as solicitações de <strong class="text-blue font-extrabold">Abertura de Intercorrência</strong>.
            Para ver as correções da base, navegue pelo menu acima.
          </p>
        </aside>
      </div>
    </section>

    <!-- Seção da Fila de Solicitações Pendentes (Carrossel) -->
    <section class="approvals-section">
      <header class="section-header">
        <div class="flex gap-3 items-center">
          <h2 class="m-0 mb-2 font-extrabold text-header-2 max-sm:text-header-3 leading-tight text-white-txt1">
            {{ visualizacaoAtiva === 'correcao' ? 'Correção da Base' : 'Abertura de Intercorrência' }}
          </h2>
          <p class="section-subtitle m-0 mb-1.5 text-body max-sm:text-label font-normal leading-relaxed text-gray-txt2-dark">
            {{
              visualizacaoAtiva === 'correcao'
                ? 'Correção de dados incorretos ou desatualizados na base de dados.'
                : 'Solicitações de abertura de intercorrências para análise e aprovação.'
            }}
          </p>
        </div>

        <p class="section-description m-0 text-body max-sm:text-label font-normal leading-relaxed text-gray-txt2-dark">
          Clique em uma solicitação para ver mais detalhes, aprovar ou arquivar.
        </p>
      </header>

      <!-- Visualização 1: Correção da Base -->
      <CarrosselFila
        v-if="visualizacaoAtiva === 'correcao'"
        :total="filaBase.length"
      >
        <p v-if="filaBase.length === 0" class="estado-fila flex items-center gap-3 text-body text-gray-txt2-dark m-0 py-6">
          Nenhuma solicitação de correção da base aguardando aprovação.
        </p>
        <CardFilaBase
          v-for="item in filaBase"
          :key="item.id"
          :solicitacao="item"
          :selecionavel="true"
          @selecionar="abrirDetalhes"
        />
      </CarrosselFila>

      <!-- Visualização 2: Abertura de Intercorrência -->
      <CarrosselFila
        v-else
        :total="filaIntercorrencia.length"
      >
        <p v-if="filaIntercorrencia.length === 0" class="estado-fila flex items-center gap-3 text-body text-gray-txt2-dark m-0 py-6">
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

    <!-- Seção de Histórico de Solicitações Resolvidas -->
    <section class="campaigns-section">
      <header class="section-header">
        <div class="flex gap-3 items-center mb-5">
          <h2 class="m-0 mb-2 font-extrabold text-header-2 max-sm:text-header-3 leading-tight text-white-txt1">
            Histórico de Solicitações
          </h2>
          <p class="section-subtitle m-0 mb-1.5 text-body max-sm:text-label font-normal leading-relaxed text-gray-txt2-dark">
            {{
              visualizacaoAtiva === 'correcao'
                ? 'Histórico das solicitações de correção anteriores que já foram resolvidas.'
                : 'Histórico de solicitações de intercorrência anteriores que já foram resolvidas.'
            }}
          </p>
        </div>

        <p class="section-description m-0 text-body max-sm:text-label font-normal leading-relaxed text-white-txt">
          Clique em uma solicitação na tabela abaixo para ver informações mais detalhadas
          e visualizar o chat que a gerou.
        </p>
      </header>

      <TabelaHistoricoSolicitacoes
        :itens="itensTabelaAtual"
        :tipo-visualizacao="visualizacaoAtiva"
        @selecionar="abrirDetalhesTabela"
      />
    </section>

    <!-- Modal com detalhes completos da solicitação selecionada -->
    <ModalDetalheSolicitacao
      :solicitacao="itemSelecionado"
      :tipo-visualizacao="visualizacaoAtiva"
      @fechar="fecharDetalhes"
      @aprovar="aprovarSolicitacao"
      @arquivar="arquivarSolicitacao"
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
