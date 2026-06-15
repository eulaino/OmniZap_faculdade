# Remover OpenAI e Criar Pendencias de Confirmacao

Data: 2026-06-15

## Contexto

O OmniZap hoje depende da OpenAI para interpretar parte das mensagens do bot de lembretes. Essa dependencia gera custo, risco de indisponibilidade por falta de creditos e respostas menos previsiveis. O objetivo e remover a OpenAI totalmente e tornar o fluxo mais deterministico, mantendo boa experiencia tanto no WhatsApp quanto no app.

## Objetivos

- Remover a OpenAI do fluxo do bot.
- Interpretar comandos por regras deterministicas.
- Criar lembretes diretamente quando a mensagem for clara.
- Criar uma pendencia de confirmacao quando a mensagem for quase clara, mas exigir confirmacao do usuario.
- Permitir confirmar ou cancelar a mesma pendencia pelo WhatsApp ou pelo app.
- Mostrar pendencias no app como modal.

## Fora de Escopo

- Trocar para outro provedor de IA.
- Implementar modelo local.
- Redesenhar telas principais do app.
- Migrar persistencia JSON para banco neste ciclo.
- Resolver autenticacao por Firebase ID token neste ciclo.

## Abordagem Escolhida

Usar pendencia central no backend.

WhatsApp e app chamam o mesmo backend. Quando uma mensagem puder ser entendida com confianca, o backend cria o lembrete. Quando faltar confirmacao, o backend salva uma `pending_action`. O app busca pendencias e mostra modal; o WhatsApp tambem aceita respostas como `sim`, `nao`, `cancelar`.

## Fluxo

```text
Usuario envia texto pelo WhatsApp ou app
  -> backend normaliza texto
  -> backend detecta intencao por regras
  -> se comando estiver completo, cria lembrete
  -> se precisar confirmacao, cria pending_action
  -> WhatsApp envia pedido de confirmacao
  -> app consulta pendencias e mostra modal
  -> usuario confirma/cancela no app ou WhatsApp
  -> backend cria lembrete ou cancela pendencia
```

## Comandos Suportados Sem IA

Criar lembrete:

```text
lembrar 18:00 beber agua
lembrar hoje 18:00 beber agua
lembrar amanha 08:00 tomar remedio
beber agua hoje 21:00
beber agua amanha 09:30
```

Gerenciar:

```text
listar lembretes
apagar lembrete 3
remover lembrete 3
ok
sim
nao
cancelar
ajuda
```

Quando o backend nao encontrar horario, responde:

```text
Nao consegui entender o horario.
Tente: lembrar 18:00 beber agua
```

Quando houver dados suficientes, mas precisar confirmacao:

```text
Voce quis criar este lembrete?
Hoje as 18:00: beber agua
Responda "sim" para confirmar ou "nao" para cancelar.
```

Regra de confianca:

- Se houver mensagem e horario valido, o backend cria lembrete direto.
- Se houver mensagem e horario valido sem data, o backend assume hoje quando o horario ainda nao passou.
- Se houver mensagem e horario valido sem data, mas o horario ja passou hoje, o backend assume amanha.
- Se houver mensagem e data relativa valida, mas o texto estiver em formato ambiguo, o backend cria pendencia.
- Se faltar horario, o backend nao cria pendencia; retorna instrucao de formato.

## Modelo de Pendencia

```json
{
  "id": 1,
  "numero": "5521999999999",
  "type": "confirm_reminder",
  "status": "pending",
  "source": "whatsapp",
  "created_at": "2026-06-15T19:30:00",
  "expires_at": "2026-06-15T20:00:00",
  "payload": {
    "date": "2026-06-15",
    "time": "18:00",
    "message": "beber agua"
  }
}
```

Status validos:

- `pending`
- `confirmed`
- `cancelled`
- `expired`

## Endpoints

Criar lembrete por texto ou dados estruturados:

```text
POST /api/lembrete
```

Entrada atual continua aceita:

```json
{
  "numero": "5521999999999",
  "mensagem": "lembrar 18:00 beber agua"
}
```

Entrada estruturada nova:

```json
{
  "numero": "5521999999999",
  "date": "2026-06-15",
  "time": "18:00",
  "message": "beber agua"
}
```

Pendencias:

```text
GET  /api/pendencias?numero=5521999999999
POST /api/pendencias/{id}/confirmar
POST /api/pendencias/{id}/cancelar
```

Confirmar cria o lembrete usando `payload`. Cancelar marca a pendencia como `cancelled`.

## Backend

Criar novos modulos:

```text
services/text_normalizer.py
services/reminder_parser.py
services/intent_router.py
services/pending_action_service.py
services/response_templates.py
```

Remover dependencias da OpenAI:

- `openai` de `requirements.txt`
- `OPENAI_API_KEY` do fluxo usado pelo app/bot
- imports e chamadas `get_interpreter()`

O parser deve retornar um resultado tipado:

```python
{
    "status": "parsed" | "needs_confirmation" | "invalid",
    "intent": "create_reminder" | "list_reminders" | "delete_reminder" | "confirm_pending" | "cancel_pending" | "help",
    "payload": {...},
    "message": "texto para o usuario"
}
```

## App

Adicionar consulta de pendencias com TanStack Query:

```text
queryKey: ["pendencias", user.uid]
refetchInterval: 10000
```

Quando houver pendencia `confirm_reminder`, exibir modal:

```text
Confirmar lembrete

Hoje as 18:00
beber agua

[Cancelar] [Confirmar]
```

Confirmar chama `POST /api/pendencias/{id}/confirmar`.
Cancelar chama `POST /api/pendencias/{id}/cancelar`.

O modal deve aparecer para pendencias criadas pelo WhatsApp e pelo app.

## Erros e Estados

- Se confirmar pendencia expirada, backend retorna erro claro e app fecha modal apos mostrar toast.
- Se nao houver pendencia, app nao mostra modal.
- Se houver mais de uma pendencia, app mostra a mais antiga primeiro.
- Se backend ficar offline, app nao bloqueia home; apenas nao mostra pendencias.

## Testes Manuais

Backend:

- `lembrar 18:00 beber agua` cria lembrete direto.
- `beber agua 18:00` cria lembrete direto.
- `beber agua` retorna erro de horario.
- `listar lembretes` lista ativos.
- `apagar lembrete 1` remove apenas lembrete do numero informado.
- `sim` confirma pendencia mais antiga.
- `nao` cancela pendencia mais antiga.

App:

- Criar lembrete estruturado pelo app.
- Criar pendencia pelo app e confirmar no modal.
- Criar pendencia pelo WhatsApp e confirmar no app.
- Criar pendencia pelo app e cancelar pelo WhatsApp.

## Riscos

- Parser por regras entende menos frases livres que IA. Mitigacao: comandos suportados claros e mensagem de ajuda objetiva.
- Pendencias em JSON nao escalam bem. Aceito neste ciclo por foco em apresentacao e funcionalidade.
- Sem autenticacao por token, endpoints continuam confiando em `numero`. Isso deve ser corrigido em ciclo posterior.
