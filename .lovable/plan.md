# Simulados — prova cronometrada no padrão PMSC que alimenta o motor

Novo recurso "Simulados": prova completa no estilo AOCP, cronometrada, gerada por IA com questões distribuídas pelos pesos do edital. Ao finalizar, o resultado é lançado por assunto e alimenta o domínio das disciplinas e o motor de prioridade.

## Formato padrão da prova (definido pelo usuário)

- **60 questões de múltipla escolha**, distribuídas:
  - Legislação Institucional: 10
  - Direito Constitucional: 8
  - Língua Portuguesa: 8
  - Direito Penal (comum): 6
  - Direito Processual Penal: 6
  - Legislação Especial: 6
  - Direito Penal Militar: 6
  - Legislação de Trânsito: 5
  - Informática: 5
- **1 redação** ao final (tema gerado por IA, texto de 20 a 30 linhas), corrigida pela IA com nota 0–10 — mesma mecânica da aba Redação.
- **Tempo máximo: 5 horas**, cronômetro regressivo na tela. Ao esgotar, a prova finaliza sozinha.
- **Nota final do simulado: 75% da prova objetiva (acertos/60) + 25% da nota da redação (0–10).** Exibida só após a correção da redação, junto das notas separadas de cada parte.
- Formato completo é o padrão; ao iniciar, o candidato vê esse resumo antes de começar.

## O que o usuário verá

1. **Nova aba "Simulados"** na seção "Gestão de estudos" da navegação.
2. **Tela de início:** resumo do formato (60 questões + redação, 5h), aviso de que são questões inéditas de treino, e botão "Iniciar simulado".
3. **Geração com progresso:** "Gerando questão 12 de 60…" — questões vêm da IA em lotes (~8 por chamada), priorizando assuntos mais pesados no edital e com domínio fraco/sem dados.
4. **Prova em execução:** uma questão por vez (enunciado + alternativas A–D), cronômetro, painel de navegação numerado (respondida / pulada), navegação livre entre questões. "Finalizar" com confirmação antes do tempo. Prova em andamento fica salva no banco — dá para fechar e retomar. Depois das 60 questões, a redação aparece com tema + campo de texto (20–30 linhas) e "Enviar para correção".
5. **Resultado:** nota geral, desempenho por matéria e por assunto, nota da redação, tempo usado e gabarito comentado de todas as questões. As 60 questões viram lançamentos agregados por assunto (quantidade/acertos/minutos) na data do dia — o domínio, o Núcleo e o painel atualizam; a nota da redação alimenta o domínio de Redação (nota × 10).
6. **Histórico:** lista de simulados anteriores com nota, tempo e gabarito comentado.

## Como funciona por dentro

- **Banco:** nova tabela `simulados` (user_id, status em_andamento/concluida, questões JSONB, respostas JSONB, texto/tema/nota da redação, tempo_limite, duração usada, nota, timestamps) com RLS por usuário e GRANTs na mesma migration (`lov_database--migration`).
- **IA:** nova server function de geração de questões em lotes, seguindo o padrão do `ai.functions.ts` (gateway Lovable, resposta JSON estrita, gabarito + explicação por questão). Correção da redação reusa `corrigirRedacao`.
- **Distribuição interna das questões:** dentro de cada matéria, assuntos escolhidos por peso (`fib`) e domínio fraco/sem dados (reusa `movingAverageMastery`/`tierInfo`).
- **Crédito no motor:** `insertLancamentos` por assunto ao concluir; redação salva em `redacoes` e nota alimenta o motor.
- **Arquivos novos/alterados:** `src/lib/simulado.ts` (distribuição + tipos), `src/lib/simulado.functions.ts` (geração IA em lotes), `src/lib/db.ts` (persistência), `src/components/views/simulado-view.tsx` (tela), `src/routes/index.tsx` (aba, título, navegação).

## Verificação

TypeScript e build; teste Playwright do fluxo: iniciar simulado, responder questões, finalizar, conferir resultado e lançamentos registrados; checar retomada de prova em andamento.
