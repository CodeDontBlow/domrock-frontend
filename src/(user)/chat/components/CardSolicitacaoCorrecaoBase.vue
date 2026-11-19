<script setup lang="ts">
import { ref } from 'vue'

export interface SolicitacaoCorrecaoBaseProps {
  valorAnterior?: string
  valorAposMudanca?: string
  tipo?: string
  matriculas?: string[]
  competencia?: string
  motivo?: string
  mensagemIntro?: string
}

const props = withDefaults(defineProps<SolicitacaoCorrecaoBaseProps>(), {
  valorAnterior: 'MAT-102, MAT-63 e MAT-42 na loja LOJA-3 somente em Novembro.',
  valorAposMudanca: 'MAT-102, MAT-63 e MAT-42 na loja LOJA-5 a partir de Julho.',
  tipo: 'Atualização',
  matriculas: () => ['MAT-102', 'MAT-63', 'MAT-42'],
  competencia: '11/2025',
  motivo: 'Os funcionários especificados foram transferidos de loja desde Julho.',
  mensagemIntro:
    'Planejei o ticket para a sua solicitação de correção da base de dados, verifique as informações e caso algo esteja errado, me diga o que alterar!\nQuando tudo estiver pronto, clique em “Solicitar Alteração” para seu chamado ir para análise!',
})

const emit = defineEmits<{
  (e: 'cancelar'): void
  (e: 'solicitar', motivo: string): void
  (e: 'salvar-motivo', novoMotivo: string): void
}>()

const motivoEditado = ref(props.motivo)
const salvoComSucesso = ref(false)

function salvarMotivo() {
  emit('salvar-motivo', motivoEditado.value)
  salvoComSucesso.value = true
  setTimeout(() => {
    salvoComSucesso.value = false
  }, 2000)
}

function handleSolicitar() {
  emit('solicitar', motivoEditado.value)
}

function handleCancelar() {
  emit('cancelar')
}
</script>

<template>
  <div class="solicitacao-correcao-container">
    <!-- Mensagem introdutória da Lana -->
    <p v-if="mensagemIntro" class="mensagem-intro">
      {{ mensagemIntro }}
    </p>

    <!-- Card de solicitação (Figma 968:3323) -->
    <article class="card-ticket" aria-labelledby="titulo-solicitacao-base">
      <!-- Cabeçalho -->
      <header class="card-header">
        <div class="card-titulo">
          <i class="bi bi-database-exclamation icone-titulo" aria-hidden="true" />
          <h3 id="titulo-solicitacao-base" class="titulo-texto">
            Solicitação de Correção de Dados
          </h3>
        </div>

        <div class="selo-lana">
          <span>Feito com Lana</span>
        </div>
      </header>

      <!-- Comparação: Valor Anterior vs Valor Após Mudança -->
      <section class="secao-comparacao" aria-label="Comparação de valores">
        <div class="bloco-valor bloco-anterior">
          <span class="rotulo-metadado">VALOR ANTERIOR</span>
          <p class="texto-valor">{{ valorAnterior }}</p>
        </div>

        <div class="seta-separadora" aria-hidden="true">
          <i class="bi bi-arrow-right icone-seta desktop" />
          <i class="bi bi-arrow-down icone-seta mobile" />
        </div>

        <div class="bloco-valor bloco-depois">
          <span class="rotulo-metadado">VALOR APÓS MUDANÇA</span>
          <p class="texto-valor">{{ valorAposMudanca }}</p>
        </div>
      </section>

      <hr class="divisor" />

      <!-- Conteúdo detalhado: Tipo, Matrículas, Competência e Motivo -->
      <div class="conteudo-grade">
        <!-- Coluna da Esquerda: Metadados estruturados -->
        <div class="coluna-esquerda">
          <!-- Tipo -->
          <div class="campo-info">
            <div class="rotulo-com-icone">
              <i class="bi bi-card-text icone-campo" aria-hidden="true" />
              <span class="rotulo-campo">TIPO</span>
            </div>
            <span class="valor-campo">{{ tipo }}</span>
          </div>

          <!-- Matrículas -->
          <div class="campo-info">
            <div class="rotulo-com-icone">
              <i class="bi bi-person-video icone-campo" aria-hidden="true" />
              <span class="rotulo-campo">MATRÍCULAS</span>
            </div>
            <div class="matriculas-tags">
              <span
                v-for="matricula in matriculas"
                :key="matricula"
                class="tag-matricula"
              >
                {{ matricula }}
              </span>
            </div>
          </div>

          <!-- Competência -->
          <div class="campo-info">
            <div class="rotulo-com-icone">
              <i class="bi bi-card-text icone-campo" aria-hidden="true" />
              <span class="rotulo-campo">COMPETÊNCIA</span>
            </div>
            <span class="valor-campo">{{ competencia }}</span>
          </div>
        </div>

        <!-- Coluna da Direita: Motivo / Textarea -->
        <div class="coluna-direita">
          <div class="motivo-cabecalho">
            <span class="motivo-titulo">MOTIVO</span>
            <span class="motivo-subtitulo">Clique na caixa de texto para alterar a descrição</span>
          </div>

          <div class="motivo-entrada">
            <textarea
              v-model="motivoEditado"
              rows="4"
              class="textarea-motivo"
              aria-label="Descrição do motivo da correção"
            />
            <button
              type="button"
              class="botao-salvar"
              :class="{ 'botao-salvar--sucesso': salvoComSucesso }"
              @click="salvarMotivo"
            >
              {{ salvoComSucesso ? 'Salvo!' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Rodapé com Botões de Ação -->
      <footer class="card-acoes">
        <button
          type="button"
          class="btn-acao btn-cancelar"
          @click="handleCancelar"
        >
          Cancelar Solicitação
        </button>

        <button
          type="button"
          class="btn-acao btn-solicitar"
          @click="handleSolicitar"
        >
          Solicitar Alteração
        </button>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.solicitacao-correcao-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 800px;
  font-family: var(--font-raleway);
  color: var(--color-white-txt1);
}

.mensagem-intro {
  margin: 0;
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
  color: var(--color-white-txt1);
  white-space: pre-wrap;
}

.card-ticket {
  background-color: var(--color-black-bg1);
  border: 2px solid var(--color-black-bg2);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.card-titulo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icone-titulo {
  font-size: 20px;
  color: var(--color-blue);
}

.titulo-texto {
  margin: 0;
  font-size: var(--text-highlight-1);
  font-weight: 500;
  line-height: var(--text-highlight-1--line-height);
  color: var(--color-white-txt1);
}

.selo-lana {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  background-color: rgba(0, 180, 241, 0.14);
  color: var(--color-blue);
  font-family: var(--font-inconsolata);
  font-size: var(--text-metadata);
  font-weight: 400;
  white-space: nowrap;
}

.secao-comparacao {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
}

.bloco-valor {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rotulo-metadado {
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  color: var(--color-gray-txt3-dark);
  text-transform: uppercase;
}

.texto-valor {
  margin: 0;
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
  color: var(--color-white-txt1);
}

.seta-separadora {
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-gray-txt3-dark);
  font-size: 20px;
}

.icone-seta.desktop {
  display: block;
}

.icone-seta.mobile {
  display: none;
}

.divisor {
  border: none;
  border-top: 2px solid var(--color-black-bg2);
  margin: 0;
}

.conteudo-grade {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.coluna-esquerda {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.campo-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rotulo-com-icone {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icone-campo {
  font-size: 15px;
  color: var(--color-gray-txt3-dark);
}

.rotulo-campo {
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  color: var(--color-gray-txt3-dark);
}

.valor-campo {
  font-size: var(--text-body);
  color: var(--color-white-txt1);
}

.matriculas-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.tag-matricula {
  font-size: var(--text-body);
  color: var(--color-white-txt1);
}

.coluna-direita {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.motivo-cabecalho {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.motivo-titulo {
  font-size: var(--text-body);
  color: var(--color-white-txt1);
}

.motivo-subtitulo {
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  color: var(--color-gray-txt3-dark);
}

.motivo-entrada {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.textarea-motivo {
  width: 100%;
  box-sizing: border-box;
  min-height: 110px;
  padding: 12px;
  background-color: var(--color-black-bg2);
  border: 1px solid var(--color-gray-txt3-dark);
  border-radius: 10px;
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  color: var(--color-gray-txt2-dark);
  resize: vertical;
}

.textarea-motivo:focus {
  outline: none;
  border-color: var(--color-blue);
}

.botao-salvar {
  padding: 4px 14px;
  border: none;
  border-radius: 5px;
  background-color: var(--color-gray-txt3-dark);
  color: var(--color-black-bg1);
  font-family: var(--font-inconsolata);
  font-size: var(--text-label);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.botao-salvar:hover {
  background-color: var(--color-gray-txt2-dark);
}

.botao-salvar--sucesso {
  background-color: var(--color-green);
  color: var(--color-black-bg1);
}

.card-acoes {
  display: flex;
  gap: 20px;
  align-items: center;
}

.btn-acao {
  flex: 1;
  padding: 12px 20px;
  border-radius: 999px;
  font-family: var(--font-raleway);
  font-size: var(--text-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.btn-cancelar {
  background: transparent;
  border: 1px solid var(--color-gray-txt2-dark);
  color: var(--color-gray-txt2-dark);
}

.btn-cancelar:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: var(--color-white-txt1);
  color: var(--color-white-txt1);
}

.btn-solicitar {
  background-color: var(--color-blue);
  border: 1px solid var(--color-blue);
  color: var(--color-black-bg1);
  font-weight: 600;
}

.btn-solicitar:hover {
  filter: brightness(1.1);
}

@media (max-width: 640px) {
  .secao-comparacao {
    grid-template-columns: 1fr;
  }

  .icone-seta.desktop {
    display: none;
  }

  .icone-seta.mobile {
    display: block;
  }

  .conteudo-grade {
    grid-template-columns: 1fr;
  }

  .card-acoes {
    flex-direction: column;
  }

  .btn-acao {
    width: 100%;
  }
}
</style>
