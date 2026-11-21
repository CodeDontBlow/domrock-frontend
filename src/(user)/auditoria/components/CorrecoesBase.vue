<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { obterServicoAuditoria } from '../services/auditoria'
import { erroConsulta, rotuloCorrecao, valorCorrecao } from '../formatacao'
import type { CorrecaoAuditoria } from '../types'
import { formatarDataHoraCurta } from '../../chat/formatacao'
import EtiquetaStatus from '../../campanhas/components/EtiquetaStatus.vue'

const servicoAuditoria = obterServicoAuditoria()

const itens = ref<CorrecaoAuditoria[]>([])
const carregando = ref(false)
const erro = ref('')
let consulta = 0
async function carregar() {
  const atual = ++consulta
  carregando.value = true
  erro.value = ''
  itens.value = []
  try {
    const resposta = await servicoAuditoria.correcoes()
    if (atual === consulta) itens.value = resposta
  } catch (e) {
    if (atual === consulta) erro.value = erroConsulta(e, 'as correções da base')
  } finally {
    if (atual === consulta) carregando.value = false
  }
}
onMounted(carregar)
onBeforeUnmount(() => ++consulta)
</script>

<template>
  <section aria-label="Correções da base">
    <h2>Correções da base</h2>
    <p v-if="carregando" class="estado" role="status">Carregando correções…</p>
    <div v-else-if="erro" class="estado erro" role="alert">
      <p>{{ erro }}</p>
      <button type="button" @click="carregar">Tentar novamente</button>
    </div>
    <p v-else-if="!itens.length" class="estado">Nenhuma correção registrada.</p>
    <div v-else class="tabela-wrapper">
      <table>
        <caption class="sr-only">
          Solicitações de correção e respectivas decisões
        </caption>
        <thead>
          <tr>
            <th scope="col">Correção</th>
            <th scope="col">Antes</th>
            <th scope="col">Depois</th>
            <th scope="col">Autor e solicitação</th>
            <th scope="col">Status</th>
            <th scope="col">Decisão</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in itens" :key="item.id">
            <th scope="row">
              {{ rotuloCorrecao(item.tipo)
              }}<small>{{ item.matricula }} · {{ item.competencia }}</small
              ><small>{{ item.motivo ?? 'Motivo não informado' }}</small>
            </th>
            <td>{{ valorCorrecao(item.antes) }}</td>
            <td>{{ valorCorrecao(item.depois) }}</td>
            <td>
              {{ item.autor.nome ?? 'Autor não informado'
              }}<small>{{ formatarDataHoraCurta(item.criada_em) }}</small>
            </td>
            <td>
              <EtiquetaStatus
                :status="item.status === 'PENDENTE' ? 'AGUARDANDO_APROVACAO' : item.status"
              />
            </td>
            <td v-if="item.decisao">
              {{ item.decisao.decisao === 'APROVADA' ? 'Aprovada' : 'Reprovada' }} por
              {{ item.decisao.por.nome ?? 'Não informado'
              }}<small>{{ formatarDataHoraCurta(item.decisao.em) }}</small
              ><small>{{ item.decisao.justificativa ?? 'Sem justificativa registrada' }}</small>
            </td>
            <td v-else>Aguardando decisão</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
