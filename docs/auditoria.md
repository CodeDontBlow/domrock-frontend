# Auditoria — visão de negócio (A6-103 / US-19)

## Manual do Auditor

O Auditor consulta campanhas de todos os autores, inclusive rascunhos, em modo
somente leitura. Após o login, a página inicial e o menu direcionam para **Auditoria**.

### Campanhas

A tabela mostra nome, autor, status, período e última alteração. Use **Buscar por nome**
e **Status** juntos para localizar uma campanha. A busca ignora diferenças entre
maiúsculas/minúsculas e acentos. Clique no nome para abrir os detalhes.

- **Versões:** selecione uma versão para consultar seus parâmetros e o resultado da
  simulação (meta, comissão e orçamento, quando informado). Escolha outra versão em
  **Comparar com** para destacar valores alterados, adicionados ou removidos. Por
  padrão, a última versão é comparada com a anterior disponível. Quando registrada,
  a re-simulação considerada na decisão também aparece, identificada separadamente.
- **Decisões:** consulte quem aprovou ou reprovou cada versão, data/hora e justificativa.
- **Conversa:** leia as mensagens do usuário, da Lana e do sistema na ordem registrada.
  Expanda as ferramentas de cada resposta para consultar sua trilha de negócio.
  Esta aba não permite enviar mensagens nem modificar a ficha.

Campanhas ainda não submetidas mostram a última ficha e simulação disponíveis.
Quando não há mensagens, versões ou resultados, a tela informa essa ausência.
As datas com horário seguem o fuso do navegador; o período mantém as datas da campanha.

### Correções da base

Na seção **Correções da base**, consulte o tipo, a matrícula, a competência, os valores
antes/depois, o autor, a data do pedido, o status, o decisor e a justificativa. A coluna
Decisão identifica se a pessoa aprovou ou reprovou. Pedidos pendentes aparecem como
aguardando decisão. Dados estruturados de RH, quando fornecidos, são apresentados
com rótulos legíveis.

O Auditor não tem botões de criação, edição, simulação, submissão, aprovação,
reprovação, cancelamento ou importação. A opção **Usar no painel** dos cenários de
simulação também fica oculta. A saída da sessão continua disponível na barra lateral.

Se uma consulta falhar, a tela mostra a falha e oferece **Tentar novamente**; não
apresenta uma falha como se a lista estivesse vazia.

## Integração com o backend

O backend da branch A6-103 inclui as alterações da A6-102, originadas no
[PR #8](https://github.com/CodeDontBlow/domrock-backend/pull/8), e os complementos de
contrato exigidos por esta tela. A incorporação foi feita como alterações locais,
sem merge, commit ou mudança de branch. A migration V12 cria o Auditor de testes.

| Consulta                       | Contrato consumido                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| Campanhas de todos os usuários | `GET /api/campanhas/auditoria` → lista de `CampanhaResumo`, incluindo `autor: { id, nome }` |
| Detalhe                        | `GET /api/campanhas/{id}` → `CampanhaDetalhe` com ações vazias para o Auditor               |
| Versão                         | `GET /api/campanhas/{id}/versoes/{numero}` → `VersaoCampanha`                               |
| Conversa                       | `GET /api/chat/{chat_id}/mensagens` → `ConversaGravada`                                     |
| Correções de todos os usuários | `GET /api/correcoes/auditoria` → lista de `SolicitacaoDetalheResponse`                      |

A rota de correções permite somente AUDITOR, inclui todos os autores em todos os
status, da solicitação mais recente para a mais antiga, e usa o envelope do detalhe:

```json
[
  {
    "id": 7,
    "tipo": "TRANSFERENCIA_LOJA",
    "matricula": "MATRIC-38",
    "competencia": "2026-11",
    "antes": "33",
    "depois": "8",
    "motivo": "Transferência de loja",
    "status": "APROVADA",
    "autor": { "id": 1, "nome": "Gabriela" },
    "criada_em": "2026-11-01T12:00:00Z",
    "decisao": {
      "decisao": "APROVADA",
      "por": { "id": 2, "nome": "Sérgio" },
      "em": "2026-11-02T12:00:00Z",
      "justificativa": "Conferido com o RH"
    }
  }
]
```

`antes` e `depois` admitem valores escalares, objetos ou null. `decisao` é null enquanto
pendente. Se a API ainda não tiver essas alterações ou estiver indisponível, a tela mostra
erro de carregamento; não há dados fictícios ou fallback para a fila do Supervisor.

As consultas usam a instância Axios existente: `VITE_API_BASE_URL` ou `/backend`, com
proxy local `API_PROXY_TARGET` e token Bearer. Nenhuma nova variável de ambiente é
necessária. As permissões no localStorage controlam a navegação e a exibição; a API
deve validar a role em cada requisição e recusar operações de escrita do Auditor.
SQL, código e alertas da aba técnica pertencem à A6-107/US-20.

## Validação

Na pasta `domrock-frontend`:

```bash
npm run test:unit -- --run
npm run type-check
npm run build-only
```

No ambiente usado nesta implementação (Node 26), o armazenamento nativo do Node
interferiu no localStorage do JSDOM, inclusive nos testes anteriores à task. Nesse
ambiente, execute os testes com:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm run test:unit -- --run
```

Para executar apenas os cenários novos:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm run test:unit -- --run 'src/(user)/auditoria' src/composables
```

O comando `npm run format` foi executado na cópia de trabalho; somente os arquivos
pertencentes à task recebem alterações de formatação na entrega.

Testes cobrem controle de perfil e navegação, filtros, versões e comparação,
decisões, conversa e trilha, correções, ausência de ações mutáveis, falhas parciais,
respostas atrasadas e requisições exclusivamente GET. Os serviços são simulados nos
testes da tela; isso não substitui a validação do contrato com a API implementada.

Para validar manualmente com as alterações de ambos os repositórios:

1. Suba backend e frontend (`npm run dev`) com a URL da API configurada.
2. Entre com o usuário Auditor de testes da A6-102 (`paulo@camplana.com.br`). Confira
   o redirecionamento para `/auditoria` e o menu apenas com Auditoria.
3. Use campanhas de autores diferentes em todos os status, incluindo rascunhos e
   arquivadas. Filtre por status/nome e abra uma campanha com pelo menos duas versões.
4. Confira a diferença de um percentual (por exemplo, 1% → 2%), parâmetros e resultados.
5. Consulte decisões e a conversa completa; expanda a trilha de uma resposta da Lana.
6. Consulte uma correção aprovada, uma reprovada e uma pendente e confira antes/depois.
7. Verifique que nenhuma ação de alteração aparece, inclusive nos cenários de simulação.
8. Digite `/`, `/campanha`, `/campanhas/12`, `/importar` e `/admin` como Auditor: a
   navegação deve voltar para Auditoria. Recarregue o detalhe e confirme que permanece nele.
9. Entre como Gerente, Supervisor e Admin e tente abrir `/auditoria`: o acesso deve
   voltar à página inicial do respectivo perfil. Verifique os fluxos anteriores.
10. Induza falha de rede e confira as mensagens e a opção Tentar novamente.

A referência aos cenários externos `docs/backlogs/sprint-3/gherkin.md#us19` não abriu
na consulta. Foram usados os critérios da A6-103 e da US-19 fornecidos nas imagens.
O contrato HTTP é coberto por testes de integração do backend com PostgreSQL.
A validação manual ponta a ponta, revisão/merge do PR e aceite do PO permanecem com a equipe.
