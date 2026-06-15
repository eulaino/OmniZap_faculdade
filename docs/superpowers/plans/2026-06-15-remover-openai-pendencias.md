# Remover OpenAI e Pendencias Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover OpenAI do bot e criar fluxo de pendencias confirmaveis pelo WhatsApp e app.

**Architecture:** Backend passa a usar parser deterministico e servico JSON de pendencias. App consulta pendencias com TanStack Query e mostra modal de confirmacao integrado ao visual do OmniZap.

**Tech Stack:** Flask, Python stdlib unittest, JSON local, Expo React Native, TanStack Query, Axios, NativeWind.

---

### Task 1: Backend Parser Sem OpenAI

**Files:**
- Create: `C:/Users/João/Desktop/botLembrete/services/text_normalizer.py`
- Create: `C:/Users/João/Desktop/botLembrete/services/reminder_parser.py`
- Create: `C:/Users/João/Desktop/botLembrete/services/response_templates.py`
- Modify: `C:/Users/João/Desktop/botLembrete/requirements.txt`
- Test: `C:/Users/João/Desktop/botLembrete/tests/test_reminder_parser.py`

- [x] Write failing unittest for supported commands and missing-time errors.
- [x] Run test and verify parser module import fails.
- [x] Implement normalizer, parser, and response templates.
- [x] Remove `openai` from requirements.
- [x] Run parser tests and verify pass.

### Task 2: Backend Pending Actions

**Files:**
- Create: `C:/Users/João/Desktop/botLembrete/services/pending_action_service.py`
- Test: `C:/Users/João/Desktop/botLembrete/tests/test_pending_action_service.py`

- [x] Write failing unittest for create/list/confirm/cancel/expire.
- [x] Run test and verify service module import fails.
- [x] Implement JSON-backed pending action service with injectable data file.
- [x] Run pending service tests and verify pass.

### Task 3: Backend Routes and WhatsApp Flow

**Files:**
- Modify: `C:/Users/João/Desktop/botLembrete/app.py`
- Test: `C:/Users/João/Desktop/botLembrete/tests/test_app_routes.py`

- [x] Write Flask test client tests for structured create, text create, missing hour, pending list, confirm, cancel.
- [x] Run test and verify endpoint failures.
- [x] Wire parser and pending service into `/api/lembrete`, `/api/pendencias`, and webhook `sim`/`nao`.
- [x] Remove `get_interpreter()` imports and OpenAI fallback paths.
- [x] Run route tests and syntax check.

### Task 4: App Modal and API Client

**Files:**
- Create: `C:/Users/João/Desktop/OmniZap_faculdade/src/hooks/usePendingActions.ts`
- Create: `C:/Users/João/Desktop/OmniZap_faculdade/src/components/PendingActionModal.tsx`
- Modify: `C:/Users/João/Desktop/OmniZap_faculdade/app/(tabs)/home.tsx`
- Modify: `C:/Users/João/Desktop/OmniZap_faculdade/app/criar-comando.tsx`

- [x] Add hook for pending actions with polling and confirm/cancel mutations.
- [x] Add modal with emerald WhatsApp palette, clear date/time payload, and confirm/cancel buttons.
- [x] Render modal on home for oldest pending action.
- [x] Send structured payload from app create screen.
- [x] Run TypeScript validation.

### Task 5: Verification

**Files:**
- No new files.

- [x] Run backend unittest suite.
- [x] Run Python syntax compile.
- [x] Run `npx tsc --noEmit`.
- [ ] Run focused manual HTTP checks if Flask/ngrok are available.
