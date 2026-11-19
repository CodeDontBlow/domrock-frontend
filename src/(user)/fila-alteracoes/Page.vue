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
      impacto: 'Resolvido',
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
  <main class="page">
    <!-- Seção de Introdução com Título, Abas e Banner Informativo -->
    <section class="intro-section">
      <header class="page-header">
        <h1>Solicitações de Alteração</h1>
      </header>

      <!-- Menu de Abas Superior (Figma 1009:5179 e 1009:5547) -->
      <nav class="abas-navegacao" aria-label="Visualizações da fila de alterações">
        <button
          type="button"
          class="aba-btn"
          :class="{ 'aba-btn--ativo': visualizacaoAtiva === 'correcao' }"
          :aria-selected="visualizacaoAtiva === 'correcao'"
          @click="alternarVisualizacao('correcao')"
        >
          Correção da Base
        </button>

        <button
          type="button"
          class="aba-btn"
          :class="{ 'aba-btn--ativo': visualizacaoAtiva === 'intercorrencia' }"
          :aria-selected="visualizacaoAtiva === 'intercorrencia'"
          @click="alternarVisualizacao('intercorrencia')"
        >
          Abertura de Intercorrência
        </button>
      </nav>

      <!-- Banner de Aviso/Notificação Informativo (Figma 1009:5180) -->
      <aside class="aviso-banner" role="status">
        <p v-if="visualizacaoAtiva === 'correcao'" class="aviso-texto">
          Você está visualizando as solicitações de <strong>Correção da Base</strong>.
          Para ver as intercorrências, navegue pelo menu acima.
        </p>
        <p v-else class="aviso-texto">
          Você está visualizando as solicitações de <strong>Abertura de Intercorrência</strong>.
          Para ver as correções da base, navegue pelo menu acima.
        </p>
      </aside>
    </section>

    <!-- Seção da Fila de Solicitações Pendentes (Carrossel) -->
    <section class="fila-section">
      <header class="section-header">
        <h2>
          {{ visualizacaoAtiva === 'correcao' ? 'Correção da Base' : 'Abertura de Intercorrência' }}
        </h2>

        <p class="section-subtitle">
          {{
            visualizacaoAtiva === 'correcao'
              ? 'Correção de dados incorretos ou desatualizados na base de dados.'
              : 'Solicitações de abertura de intercorrências para análise e aprovação.'
          }}
        </p>

        <p class="section-description">
          Clique em uma solicitação para ver mais detalhes, aprovar ou arquivar.
        </p>
      </header>

      <!-- Visualização 1: Correção da Base -->
      <CarrosselFila
        v-if="visualizacaoAtiva === 'correcao'"
        :total="filaBase.length"
      >
        <p v-if="filaBase.length === 0" class="estado-vazio">
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
        <p v-if="filaIntercorrencia.length === 0" class="estado-vazio">
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
    <section class="historico-section">
      <header class="section-header">
        <h2>Histórico de Solicitações</h2>

        <p class="section-subtitle">
          {{
            visualizacaoAtiva === 'correcao'
              ? 'Histórico das solicitações de correção anteriores que já foram resolvidas.'
              : 'Histórico de solicitações de intercorrência anteriores que já foram resolvidas.'
          }}
        </p>

        <p class="section-description">
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
  padding: 40px 24px 32px;
  box-sizing: border-box;
  color: var(--color-white-txt1);
  font-family: var(--font-raleway);
}

.intro-section {
  margin-bottom: 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: var(--text-header-1);
  line-height: var(--text-header-1--line-height);
  font-family: var(--font-forum);
  font-weight: 400;
  color: var(--color-white-txt1);
}

.abas-navegacao {
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--color-black-bg2);
  gap: 16px;
}

.aba-btn {
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-family: var(--font-raleway);
  font-size: var(--text-body);
  color: var(--color-gray-txt2-dark);
  cursor: pointer;
  transition: all 0.15s ease;
}

.aba-btn:hover {
  color: var(--color-white-txt1);
}

.aba-btn--ativo {
  color: var(--color-white-txt1);
  border-bottom-color: var(--color-blue);
  font-weight: 600;
}

.aviso-banner {
  background-color: var(--color-black-bg2);
  border-left: 3px solid var(--color-blue);
  border-radius: 5px;
  padding: 12px 18px;
}

.aviso-texto {
  margin: 0;
  font-size: var(--text-body);
  line-height: 1.5;
  color: var(--color-white-txt1);
}

.aviso-texto strong {
  color: var(--color-blue);
}

.fila-section {
  margin-bottom: 56px;
}

.historico-section {
  margin-bottom: 32px;
}

.section-header {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-header h2 {
  margin: 0;
  font-size: var(--text-header-2);
  line-height: var(--text-header-2--line-height);
  font-weight: 800;
  color: var(--color-white-txt1);
}

.section-subtitle {
  margin: 0;
  font-size: var(--text-body);
  color: var(--color-gray-txt2-dark);
}

.section-description {
  margin: 0;
  font-size: var(--text-body);
  color: var(--color-white-txt1);
  line-height: 1.5;
}

.estado-vazio {
  margin: 0;
  padding: 24px 0;
  color: var(--color-gray-txt2-dark);
  font-size: var(--text-body);
}

@media (max-width: 1024px) {
  .page {
    padding: 32px 16px 24px;
  }
}

@media (max-width: 640px) {
  .page {
    padding: 24px 12px 20px;
  }

  .page-header h1 {
    font-size: var(--text-header-2);
    line-height: var(--text-header-2--line-height);
  }

  .abas-navegacao {
    gap: 8px;
  }

  .aba-btn {
    padding: 8px 12px;
    font-size: var(--text-label);
  }
}
</style>
