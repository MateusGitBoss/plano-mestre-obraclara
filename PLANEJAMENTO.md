# ObraClara — Planejamento do App de Gestão

**Obra piloto:** Maternidade Porte I · Cliente Sr. Rafael · Fornecimento de vigotas treliçadas
**Fornecedor:** MSE — Maranhão Soluções de Engenharia
**Status:** planejamento (nada de código ainda — bater o martelo primeiro)
**Data:** 06/08/2026

---

## 1. A obra em números

Dados extraídos das 3 propostas comerciais de 14/07/2026. **Peças e metros conferem 100%** com os totais declarados em cada PDF — os 366 itens de vigota estão em [`dados/contrato-maternidade.json`](dados/contrato-maternidade.json).

| Proposta | Projeto | Itens | Peças | Metros | Valor | R$/m |
|---|---|---:|---:|---:|---:|---:|
| MSE-2026-076 | EST 26 | 146 | 1.874 | 7.381,12 | R$ 107.222,38 | 14,53 |
| MSE-2026-077 | EST 27 | 143 | 1.765 | 6.332,99 | R$ 97.312,22 | 15,37 |
| MSE-2026-078 | EST 28 | 77 | 928 | 2.925,08 | R$ 72.807,19 | **24,89** |
| **Total** | | **366** | **4.567** | **16.639,19** | **R$ 277.341,79** | 16,67 |

Com o desconto de 18% em negociação:

| | |
|---|---:|
| Contrato bruto | R$ 277.341,79 |
| Desconto 18% | −R$ 49.921,52 |
| **Contrato líquido** | **R$ 227.420,27** |
| Preço líquido por metro | R$ 13,67 |
| Preço líquido por peça | R$ 49,80 |
| Entrada (50%) | R$ 113.710,14 |
| Saldo (medições) | R$ 113.710,13 |

**Escopo:** MSE entra **só com mão de obra e concreto**. Ferragem (treliças TG12/TR 12645 + vergalhões de reforço) e frete de retirada são do contratante.

---

## 2. Diagnóstico: o que os números dizem

### 2.1 Prazo

16.639 m ÷ 300 m/dia = **55,5 dias úteis ≈ 2,5 meses ≈ 11 semanas** (a 22 dias úteis/mês).

### 2.2 Custo e resultado no cenário base (300 m/dia)

| | Valor | Por metro |
|---|---:|---:|
| Concreto (já com perda de 10%) | R$ 52.156,00 | 3,13 |
| Mão de obra da fábrica (R$ 21.760/mês × 2,52) | R$ 54.858,91 | 3,30 |
| Pátio da fábrica (R$ 3.000/mês × 2,52) | R$ 7.563,27 | 0,45 |
| **Custo direto** | **R$ 114.578,17** | **6,89** |
| Estrutura — escritório R$ 16.000 + dívida R$ 5.000 + escritório R$ 4.000 | R$ 63.027,23 | 3,79 |
| **Custo total** | **R$ 177.605,41** | **10,67** |
| | | |
| Margem de contribuição (antes da estrutura) | R$ 112.842,10 | **49,6%** |
| **Resultado final** | **R$ 49.814,86** | **21,9%** |

A obra fecha no azul. Mas com duas travas que precisam ficar visíveis todo dia.

### 2.3 Trava nº 1 — o ponto de equilíbrio é 215 m/dia

O concreto é o único custo que varia com a produção (R$ 3,13/m). Todo o resto é fixo por mês. Então cada metro produzido contribui com **R$ 10,53** para pagar R$ 49.760/mês de custo fixo:

- **Break-even total: 4.724 m/mês = 215 m/dia.** Abaixo disso, a obra não paga a estrutura da MSE.
- **Break-even direto: 2.351 m/mês = 107 m/dia.** Abaixo disso, ela nem paga o próprio custo de fábrica.

A meta de 300 m/dia tem só **28% de folga** sobre o ponto de equilíbrio. Sensibilidade:

| Ritmo | Prazo | Custo total | Resultado | Margem |
|---:|---:|---:|---:|---:|
| 400 m/dia | 42 dias | R$ 146.243 | R$ 81.177 | 35,7% |
| 350 m/dia | 48 dias | R$ 159.684 | R$ 67.736 | 29,8% |
| **300 m/dia** | **56 dias** | **R$ 177.605** | **R$ 49.815** | **21,9%** |
| 250 m/dia | 67 dias | R$ 202.695 | R$ 24.725 | 10,9% |
| 215 m/dia | 77 dias | R$ 227.202 | R$ 219 | 0,1% |
| 200 m/dia | 83 dias | R$ 240.330 | −R$ 12.910 | −5,7% |
| 150 m/dia | 111 dias | R$ 303.055 | −R$ 75.635 | −33,3% |

**Cair de 300 para 250 m/dia custa R$ 25 mil. Cair para 200 custa R$ 63 mil.** Metade do lucro se perde em 50 m/dia de ritmo. É por isso que o app tem que ser, antes de tudo, um medidor de ritmo.

E o efeito é duplo: ritmo baixo estica os meses de custo fixo **e** encarece o concreto, porque a concreteira cobra volume mínimo por viagem — dia de pouca produção joga concreto fora.

### 2.4 Trava nº 2 — o desconto de 18% é praticamente o lucro inteiro

| | Resultado | Margem |
|---|---:|---:|
| Sem desconto | R$ 99.736 | 36,0% |
| Com 18% | R$ 49.815 | 21,9% |

O desconto de R$ 49.921 é quase exatamente o resultado projetado de R$ 49.815. **Cada 1% de desconto vale R$ 2.773** — ou 5,6% do lucro. Fechar em 15% em vez de 18% coloca R$ 8.320 a mais no bolso, sem produzir um metro a mais.

### 2.5 Caixa

A entrada de 50% banca a obra. Com medição mensal paga no mês seguinte:

| Mês | Produção | Recebe | Paga | Caixa acumulado |
|---|---:|---:|---:|---:|
| 1 | 6.600 m | R$ 113.710 | R$ 70.448 | R$ 43.262 |
| 2 | 6.600 m | R$ 45.104 | R$ 70.448 | R$ 17.918 |
| 3 | 3.439 m | R$ 45.104 | R$ 36.710 | R$ 26.312 |
| 4 | — | R$ 23.503 | — | R$ 49.815 |

O caixa nunca fica negativo — **desde que a entrada caia antes de começar a produzir**. Sem ela, a MSE financia R$ 70 mil/mês do próprio bolso. O mês 2 é o mais apertado (folga de R$ 18 mil). **Regra prática: não ligar a fábrica antes da entrada compensar.**

---

## 3. Pendências antes de assinar

> **Atualização de 06/08/2026 — decisões batidas:**
> **(1) Ferragem 100% do contratante nas três propostas** — resolve a pendência abaixo; uniformizar o texto da EST 26 e EST 27 continua valendo, mas o custo já está fora do escopo MSE nas três. **(2) Prazo pedido: 3 meses**, usado como referência contratual no app (tela Cronograma). **(3) Custos confirmados pelo Maurício** — concreto R$ 52.156 (com perda de 10%), mão de obra R$ 21.760/mês, pátio R$ 3.000/mês, escritório R$ 16.000, dívida Mateus R$ 5.000, escritório R$ 4.000, meta 300 m/dia. São exatamente os números já usados no modelo abaixo — nada mudou nos cálculos.

Duas coisas continuam valendo a pena resolver antes de assinar:

**1. Uniformizar o texto de exclusão de ferragem nas três propostas.**
A EST 28 diz explicitamente que "as treliças TG12/TR 12645 e os vergalhões de reforço deverão ser disponibilizados pelo contratante". A EST 26 e a EST 27 **não têm essa ressalva por escrito** — mesmo com a decisão de que a ferragem é 100% do contratante nas três, o contrato final deve deixar isso escrito nas três propostas, não só na EST 28.

**2. A EST 28 sai 63% mais cara por metro que a EST 26.**
R$ 24,89/m contra R$ 14,53/m e R$ 15,37/m — mesmo produto, mesma treliça, comprimento médio parecido (3,15 m contra 3,94 m e 3,59 m). Ou os custos indiretos foram todos alocados na EST 28, ou a EST 26 e a EST 27 estão subprecificadas. Vale conferir a composição antes de dar 18% em cima do conjunto.

**3. O desconto de 18% zera boa parte do lucro projetado.** Ver 2.4.

### Perguntas que faltam para fechar o modelo

| # | Pergunta | Por que importa |
|---|---|---|
| 1 | Salário escritório, dívida e escritório são mensais e 100% desta obra? | Assumi que sim. Se for rateio, o resultado sobe. |
| 2 | 22 ou 26 dias úteis/mês (com sábado)? | Muda o prazo de 2,5 para 2,1 meses e o resultado em ~R$ 10 mil. |
| 3 | Quantas formas/pistas tem a fábrica? | 300 m/dia é limitado por forma, por concreto ou por gente? Define se dá para acelerar. |
| 4 | Volume mínimo cobrado por viagem de concreto (m³)? | Define o lote mínimo econômico de produção diária. |
| 5 | Prazo contratual e multa por atraso? | Não consta nas propostas ("a definir"). É risco aberto. |
| 6 | Medição: periodicidade e prazo de pagamento? | O modelo de caixa inteiro depende disso. |
| 7 | O munck da fábrica até o caminhão está no custo? | O frete de retirada é do contratante, mas o carregamento é nosso. |
| 8 | Volume total de concreto (m³)? | R$ 52.156 sugere ~80 m³ a preço de mercado. Precisa confirmar para rastrear consumo real. |
| 9 | Ordem de produção: EST 26 → 27 → 28, ou por liberação da obra? | Define o cronograma e a sequência de medição. |

---

## 4. Benchmark: o que copiar dos melhores

Pesquisei o que as plataformas líderes fazem e separei o que serve para uma operação de 3 pessoas e uma obra de 2,5 meses — e o que só atrapalha.

### O que vale copiar

| De onde | O que | Como aplica aqui |
|---|---|---|
| **Procore** | Orçado → Comprometido → Realizado → **Projetado** (4 colunas, a projeção editável na mão) | Toda linha de custo mostra as 4 colunas. O gerente pode sobrescrever a projeção quando sabe de algo que o sistema não sabe. |
| **Planyard / Bauwise** | Cost-to-Complete e EAC recalculados a cada lançamento | O resultado da obra se atualiza sozinho a cada dia apontado. Sem fechamento mensal para descobrir que perdeu dinheiro. |
| **Buildertrend** | Diário de obra em 30 segundos no celular + portal do cliente | O apontamento do dia tem que caber em 3 toques. E o Sr. Rafael ganha um link read-only com o avanço. |
| **Raken / Fieldwire** | Offline-first com fila de sincronização | Fábrica e obra com internet ruim. Aponta offline, sincroniza depois. |
| **Last Planner System (Lean)** | Plano semanal só com atividade **sem restrição** + PPC | Quadro de restrições: ferragem chegou? concreto programado? forma livre? PPC semanal como termômetro. Referência: PPC 70–85% = obra sob controle. |
| **EVM (PMI)** | Curva S, CPI/SPI, EAC | Curva S de **metros** previsto × realizado. Mas traduzido: em vez de "SPI 0,87", o app diz **"4 dias atrasado, R$ 12 mil acima do custo"**. |

### O que ignorar de propósito

RFI, submittals, BIM, punch list, gestão de licitação, dashboard de portfólio, aprovação em múltiplos níveis. São os módulos que fazem o Procore ser Procore — e são exatamente os que fazem equipe pequena abandonar o sistema na terceira semana.

> **Regra de ouro do projeto: se não couber em 3 toques no celular, não entra.**
> Um app que ninguém alimenta não dá clareza nenhuma. Funcional > completo.

---

## 5. Os 4 números que governam a obra

O painel inteiro existe para responder quatro perguntas. Tudo o mais é detalhe.

| # | Número | O que responde | Semáforo |
|---|---|---|---|
| 1 | **Ritmo** — média móvel de 7 dias, em m/dia | Estamos ganhando ou perdendo dinheiro? | 🟢 ≥ 300 · 🟡 215–300 · 🔴 < 215 |
| 2 | **Data projetada de término** — recalculada pelo ritmo real | Vamos entregar quando? | contra a data contratual |
| 3 | **Resultado projetado (EAC)** — em R$ e % | Quanto sobra no fim, do jeito que está indo? | contra os R$ 49.815 do plano |
| 4 | **Caixa nas próximas 4 semanas** | Vai faltar dinheiro? Quando? | 🔴 se projetar saldo negativo |

Esses quatro ficam no topo de toda tela, sempre. É a "clareza da gestão" que você pediu, reduzida ao mínimo.

---

## 6. As telas

Seis telas. Nem uma a mais.

### 1 — Hoje (tela inicial, feita para o celular)

A tela que a fábrica abre todo dia às 17h. Apontamento em 30 segundos:

- Metros e peças produzidos hoje (com seletor de lote EST 26/27/28)
- Efetivo presente
- m³ de concreto recebidos e nº de viagens
- Foto (opcional) e ocorrência (opcional)

Em cima, os 4 números. Embaixo, uma frase única em português claro:

> *"Hoje: 285 m. Ritmo dos últimos 7 dias: 292 m/dia. No ritmo atual a obra termina em 18/10 e fecha com R$ 46,2 mil (−R$ 3,6 mil vs. plano)."*

### 2 — Cronograma

- **Curva S em metros**: previsto × realizado × projetado
- Data de término projetada, atualizada a cada apontamento
- Avanço por lote (EST 26 / 27 / 28) com barra e % — quanto falta de cada projeto
- Calendário de concretagem e marcos de entrega

### 3 — Financeiro

- Contrato: bruto, desconto, líquido, entrada, saldo
- Medições: previstas → enviadas → aprovadas → faturadas → pagas
- Custos lançados por categoria, com as 4 colunas (orçado / comprometido / realizado / projetado)
- **Custo real por metro produzido**, comparado com os R$ 10,67 do plano
- Resultado realizado × projetado (EAC)

### 4 — Caixa

- Fluxo semanal projetado, 12 semanas à frente
- Curva de recebimento × curva de desembolso
- Saldo mínimo projetado e **em que semana** ele acontece
- Alerta de furo antes de acontecer, não depois

### 5 — Simulador (a tela de bater o martelo)

Sliders: **ritmo (m/dia) · preço/m · custo do concreto/m³ · folha mensal · % de desconto**.
Saída em tempo real: prazo, custo total, resultado, margem, ponto de equilíbrio.

Serve para decidir agora (aceito 18%? aguento 250 m/dia?) e para negociar as próximas obras com número na mão.

### 6 — Restrições e alertas

Quadro do Last Planner enxuto: o que trava a produção da semana.

- Ferragem entregue pelo contratante? (esta é a restrição nº 1 — sem treliça não há vigota)
- Concreto programado com a concreteira?
- Formas liberadas / desformadas?
- Projeto liberado / revisão pendente?
- Pagamento em dia?

Cada restrição tem responsável, prazo e status. **PPC semanal** = % do que foi planejado e cumprido.

### Fase 2 — Portal do cliente

Link read-only para o Sr. Rafael: avanço, fotos, medições aprovadas. Sem custo, sem margem, sem custo interno. Reduz cobrança por WhatsApp e ajuda a destravar pagamento.

---

## 7. Modelo de dados

Já nasce com `obra_id` em tudo, para a segunda obra ser só um cadastro.

```
obra              id, nome, cliente, contrato_bruto, desconto_pct, contrato_liquido,
                  meta_m_dia, dias_uteis_mes, data_inicio, prazo_dias, status

lote              id, obra_id, codigo (EST26), proposta, projeto,
                  pecas, metros, valor_bruto, preco_medio_m, ordem

item_vigota       id, lote_id, codigo (VT314b), laje (L314), comp_m,
                  reforco, qtde, preco_m, total

producao_dia      id, obra_id, lote_id, data, metros, pecas, efetivo,
                  m3_concreto, viagens_concreto, obs, fotos[]

custo             id, obra_id, data, categoria, tipo (fixo|variavel),
                  valor, fornecedor, doc_url, competencia

medicao           id, obra_id, periodo, metros, valor_bruto, valor_liquido,
                  status (prevista|enviada|aprovada|faturada|paga),
                  data_prevista_pgto, data_pgto

restricao         id, obra_id, tipo, descricao, responsavel, prazo, status

plano_semanal     id, obra_id, semana, meta_m, realizado_m, ppc
```

Os 366 itens de vigota e todos os parâmetros já estão em [`dados/contrato-maternidade.json`](dados/contrato-maternidade.json), prontos para carregar.

---

## 8. Stack

Manter o que já funciona para vocês, sem inventar moda:

| Decisão | Escolha | Por quê |
|---|---|---|
| Front | `index.html` único, sem framework, sem build | É o padrão dos 3 repos de vocês e permite editar e publicar em minutos |
| Backend | **Firebase** (Firestore + Auth + Storage) | O `mse-gestao` já roda nisso — **login único** para o time, sem cadastro novo. E o Firestore tem persistência offline nativa, que é o que a fábrica precisa |
| PWA | manifest + service worker | Instala no celular como app, funciona sem sinal e sincroniza depois |
| Deploy | Vercel | O repo já tem `vercel.json` |
| Design | O do ObraClara atual | Já está bom, é o melhor dos três repos |

**Descartado:** Supabase (o `obra-control` usa, mas exigiria segundo login e segunda base) e qualquer framework com build step (atrito sem retorno para uma obra de 2,5 meses).

---

## 9. Roadmap

| Fase | O que entra | Quando serve |
|---|---|---|
| **0 — agora** | Validar as pendências do item 3, fechar o contrato | Antes de assinar |
| **1 — semana 1** | Contrato carregado + tela **Hoje** + **Cronograma** | Já dá para usar no dia 1 de produção |
| **2 — semana 2** | **Financeiro** + **Caixa** + **Medições** | Primeira medição |
| **3 — semana 3** | **Simulador** + **Restrições/PPC** + PWA offline | Obra em regime |
| **4 — depois** | Portal do cliente + segunda obra | Replicação |

A Fase 1 é o mínimo que já dá clareza: se você souber o ritmo e a data projetada, você já sabe se a obra está ganhando ou perdendo dinheiro.

---

## 10. Premissas assumidas

Registradas para poderem ser corrigidas:

1. Salário escritório (R$ 16.000), dívida (R$ 5.000) e escritório (R$ 4.000) são **mensais** e alocados **100%** nesta obra — por ser a obra ativa.
2. **22 dias úteis/mês.**
3. Os R$ 52.156 de concreto são o **total do contrato**, já com a perda de 10% embutida.
4. O concreto é o único custo variável; mão de obra e pátio são fixos mensais enquanto a fábrica estiver produzindo.
5. A produção acompanha o ritmo médio de forma linear (sem curva de aprendizado nem ramp-up).
6. Medição mensal proporcional ao produzido, com 50% já adiantado na entrada, pagamento no mês seguinte.
7. O contrato líquido de R$ 227.420,27 é o valor com os 18% — se fechar em outro percentual, todos os números do documento mudam proporcionalmente.

---

## 11. O app — já no ar

A Fase 1 foi construída em `index.html` + `app.js` + `pages.js`, direto neste repositório, na mesma branch. É um app único (sem build, sem framework), com as 6 telas do plano:

- **Hoje** — apontamento diário de produção em poucos campos, com os 4 números do topo se atualizando a cada lançamento.
- **Cronograma** — curva S (previsto × realizado), datas de início/prazo/término projetado, avanço por lote EST 26/27/28.
- **Financeiro** — contrato, ledger de custos, medições, e a visão orçado × realizado × projetado (EAC).
- **Caixa** — projeção de 12 semanas com alerta de furo de caixa antes de acontecer.
- **Simulador** — sliders de ritmo, desconto, concreto e custo fixo, recalculando prazo/custo/resultado/margem em tempo real.
- **Restrições** — quadro Last Planner (ferragem, concreto, formas, projeto, pagamento) + PPC semanal.

**Como funciona:**
- **Acesso:** PIN simples de equipe (`2027`), mesmo padrão de segurança leve dos outros apps da MSE. Trocar em `pages.js` → `APP_PIN` quando quiser.
- **Dados:** salvos no aparelho (`localStorage`) e sincronizados com o Firebase do `mse-gestao` (mesmo projeto, coleção separada `obraclara_maternidade`) — funciona offline e sincroniza quando a internet volta.
- **PWA:** `manifest.json` + `sw.js` deixam o app instalável no celular, com o shell em cache para abrir sem sinal.
- **Motor de cálculo:** `calcModel()` em `app.js` é o mesmo modelo validado no diagnóstico (seção 2) — o cenário-base de 300 m/dia bate com os números deste documento. A projeção viva (`projecao()`) troca a meta pelo ritmo real assim que o primeiro apontamento é lançado.

**O que ainda não entrou** (Fases 2–4 do roadmap): portal do cliente e replicação para a próxima obra.

---

## Fontes do benchmark

- [Best Construction Project Management Software 2026 — Construction Coverage](https://constructioncoverage.com/construction-project-management-software)
- [Buildertrend vs. Procore 2026](https://buildertrend.com/buildertrend-vs-procore/)
- [Cost-to-Complete (CTC) vs. Estimate-at-Completion (EAC) — RedTeam](https://blog.redteam.com/cost-to-complete-ctc-vs-estimate-at-completion-eac/)
- [Construction Cash Flow Forecasting — Bauwise](https://www.bauwise.com/construction-cash-flow-forecasting/)
- [Construction Cash Flow Forecasting Software — Planyard](https://planyard.com/construction-cash-flow-forecasting-software)
- [Earned Value Management e S-Curve — PTAG](https://ptaginc.com/earned-value-management/)
- [EVM & S-Curves in Construction — Strata Digital](https://stratadigital.io/leveraging-earned-value-and-s-curves-in-construction-scheduling-for-effective-project-management/)
- [Last Planner System na Prática — MENSURA Engenharia](https://mensuraengenharia.com.br/blog/last-planner-na-pratica.html)
- [Last Planner System — Sienge](https://sienge.com.br/blog/last-planner-system/)
- [Guia prático para implementação do Last Planner System — Autodesk Mundo AEC](https://blogs.autodesk.com/mundoaec/guia-pratico-para-implementacao-do-last-planner-system-na-construcao/)
