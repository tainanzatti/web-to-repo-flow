# Simulados — prova cronometrada que alimenta o motor

Novo recurso "Simulado": o candidato faz uma prova no estilo AOCP, cronometrada, com questões geradas por IA distribuídas pelos pesos do edital. Ao finalizar, o resultado é registrado como lançamentos de questões por assunto, alimentando o domínio das disciplinas e o motor de prioridade (exatamente como o Bloco 4 fez com as redações).

## O que o usuário verá

1. **Nova aba "Simulados"** na seção "Gestão de estudos" da navegação.
2. **Tela de configuração:** escolha do tamanho (10, 20 ou 40 questões) e tempo (padrão 3 min/questão, ajustável). Explica a distribuição por matéria segundo o edital.
3. **Prova em execução:** uma questão por vez, enunciado + 4 alternativas (A–D), cronômetro regressivo, painel de navegação numerado (respondida / pulada), pode navegar entre questões e finalizar antes do tempo (com confirmação). Ao esgotar o tempo, finaliza sozinha. Estado salvo no banco — dá para fechar e retomar depois.
4. **Geração com progresso:** "Gerando questão 12 de 20…" — o corpo da prova vem da IA em lotes (~8 questões por chamada), priorizando assuntos fracos/sem dados e mais pesados no edital.
5. **Resultado:** nota geral (%), desempenho por matéria e por assunto, tempo usado, gabarito comentado de todas as questões. O resultado é lançado automaticamente como lançamentos (quantidade/acertos/minutos por assunto) na data do dia — mesmo fluxo de "Lançamento de questões", então o domínio, o Núcleo e o painel atualizam.
6. **Histórico:** lista de simulados anteriores com nota, tamanho e botão para rever o gabarito comentado.

## Como funciona por dentro

- **Banco:** nova tabela `simulados` (user_id, status em_andamento/concluida, questões em JSONB, respostas em JSONB, total, tempo_limite, duração usada, nota, timestamps) com RLS por usuário e GRANTs na mesma migration (`lov_database--migration`).
- **IA:** nova server function `gerarQuestoesSimulado` em `src/lib/simulado.functions.ts`, seguindo o padrão do `ai.functions.ts` (gateway Lovable, modelo atual, resposta em JSON estrito), pedindo questões inéditas estilo AOCP com gabarito e explicação.
- **Distribuição das questões:** proporcional ao campo `questoes` de cada disciplina do currículo; os assuntos dentro da disciplina são escolhidos por peso (`fib`) e domínio fraco/sem dados (reusa `movingAverageMastery`/`tierInfo`).
- **Crédito no motor:** ao concluir, um lancamento agregado por assunto (quantidade, acertos, minutos) entra via `insertLancamentos`.
- **Arquivos novos/alterados:** `src/lib/simulado.ts` (distribuição + prompts auxiliares), `src/lib/simulado.functions.ts` (geração IA), `src/lib/db.ts` (persistência), `src/components/views/simulado-view.tsx` (tela), `src/routes/index.tsx` (aba, título e navegação).
- Redação fica fora do simulado (mantém o fluxo próprio da Redação).

## Verificação

TypeScript e build; teste Playwright do fluxo: criar simulado de 10 questões, responder, finalizar, conferir resultado e lançamento registrado; checar retomada de prova em andamento.
