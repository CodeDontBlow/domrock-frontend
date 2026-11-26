# A6-109 — Quanto cada pessoa recebe

## Uso

No bloco Comissão do resultado da simulação, a tabela **Quanto cada pessoa recebe**
mostra Matrícula, Cargo, Loja, Base, %, Ajustes e Valor final. A competência aparece
abaixo da matrícula, pois a mesma pessoa pode ter linhas em meses diferentes.

Os filtros de loja e cargo combinam-se e valem para todas as linhas. A paginação tem
10 registros, com Anterior/Próxima, seguindo a tela de usuários. Alterar filtros ou
receber outro resultado volta à primeira página. O subtotal dos filtros considera
todas as páginas; o total geral permanece sem filtros para comparação com **Com a
campanha**. Ausência de registros e simulações antigas sem detalhamento têm mensagens
próprias.

As etiquetas preservam os códigos e as descrições das regras que a Lana enviou,
incluindo 5a a 5g e piso. Não há aplicação de regras de comissão no navegador.
Valores monetários usam o formatador existente em reais, com duas casas decimais.

## Contrato e integração

O formato existente da A6-77 foi conferido em `app/simulacao/dtos.py`,
`app/simulacao/por_pessoa.py` e `docs/a6-77-apuracao-completa.md` da Lana. O campo
`resultado.apuracao_por_pessoa` é uma lista de:

```json
{
  "matricula": "MATRIC-30",
  "competencia": "2025-10",
  "cod_loja": "5",
  "cod_marca": "10",
  "cod_cargo": "100",
  "base_calculo": 155000.0,
  "pct_comiss": 2.0,
  "detalhamento": [
    { "regra": "5a", "descricao": "5a — % da base: 2%" },
    { "regra": "5c", "descricao": "5c — admissão em 10/10: 21 de 31 dias" }
  ],
  "comissao_atual": 2100.0,
  "comissao_com_campanha": 2100.0
}
```

- Base e % correspondem à regra base 5a/5b, antes dos ajustes e campanhas. O contrato
  não fornece um percentual final único por pessoa; a interface explicita essa
  distinção e mantém o quadro existente de percentuais vigentes por trecho.
- Valor final é `comissao_com_campanha`, já calculado pela Lana.
- A soma dos valores finais, em centavos, deve coincidir com `totais.simulado`.
  Não é comparada com `totais.diferenca` (custo adicional) nem com a projeção `na_meta`.
- Havendo divergência, os valores recebidos são preservados e a tela mostra um aviso
  com ambos os totais. Não há rateio ou ajuste artificial para forçar a igualdade.
- Ausente ou null significa detalhamento indisponível; lista vazia significa nenhum
  registro. Uma lista vazia com total simulado diferente de zero também é sinalizada.
- O backend já transporta o resultado completo como JSON em
  `GET /api/simulacoes/{id}` e nas consultas de campanhas/versões. Reabertura do chat
  e outras telas que reutilizam `ResultadoSimulacao` recebem a tabela automaticamente.

Somente o frontend foi alterado. Não há endpoints, dependências ou variáveis de
ambiente novas. São mantidos o Axios e as configurações `VITE_API_BASE_URL` e
`API_PROXY_TARGET` existentes.

## Testes

Na pasta `domrock-frontend`:

```bash
npm run test:unit -- --run
npm run type-check
npm run build-only
npm run format
```

No Node 26 usado na implementação, o localStorage nativo interfere no ambiente JSDOM.
Nesse ambiente, use:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm run test:unit -- --run
```

Os testes em `src/(user)/chat/__tests__/apuracao.spec.ts` cobrem soma em centavos,
formatação em reais, regras e piso, múltiplas competências, paginação, filtros,
subtotal/total, divergência, lista vazia, compatibilidade com resultados antigos,
troca de resultado e integração no bloco Comissão. Os exemplos usam o contrato
real da A6-77; os cálculos de RH continuam cobertos na Lana.

### Conferência manual

1. Suba a aplicação com a Lana contendo A6-77/A6-108 e realize uma simulação.
2. Abra o bloco Comissão e compare o total da tabela com **Com a campanha**.
3. Confira as etiquetas de uma pessoa com admissão, demissão, férias ou afastamento.
4. Navegue entre páginas e combine os filtros; o total geral deve permanecer igual.
5. Limpe os filtros e reabra a simulação gravada; todas as linhas devem continuar disponíveis.
6. Em uma simulação com mais de uma competência, confira a identificação do mês.
7. Confira a tabela em tela estreita: o conteúdo deve permitir rolagem horizontal.

A referência externa ao Gherkin US-21 não abriu na consulta. Os critérios usados
foram os textos e imagens fornecidos e o contrato implementado na Lana. A validação
manual com serviços reais, revisão/merge e aceite do PO ficam para a equipe.

Validação automatizada desta entrega: 431 testes passaram (16 novos), verificação
de tipos e build concluídos. `npm run format` executado; formatação fora do escopo
não foi incluída. O build emitiu aviso de bundle acima de 500 kB.
