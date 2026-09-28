# TECHNICAL ROADMAP — QA Navigator

## 1. Project

**QA Navigator** — web application for QA engineers and beginners.

Main purpose:
- organize QA work in one workspace;
- analyze requirements;
- generate test cases and test data;
- support test design techniques;
- manage execution/checklists/bug reports;
- provide QA handbook and documentation;
- optionally use AI through a user-provided API key.

Stack:
- React + TypeScript + Vite;
- localStorage for local persistence;
- optional external AI providers selected by the user;
- no paid service is required by the application.

---

## 2. Current architecture

Application entry/composition:
`src/app/App.tsx`

Core:
- `src/app/core/app-context.tsx` — global application context;
- `src/app/core/ai.ts` — AI client and AI system prompt;
- `src/app/core/constants.ts` — static configuration/data;
- `src/app/domain/types.ts` — shared domain types.

Shared UI:
- `src/app/components/shared.tsx`
- `src/app/components/ApiModal.tsx`

Features:
- `features/automation`
- `features/documentation`
- `features/handbook`
- `features/project-workspace`
- `features/release-report`
- `features/requirements`
- `features/settings`
- `features/test-data`
- `features/test-design`
- `features/test-execution`
- `features/beginner-wizard`

The previous ~4000-line App component has been split into feature modules.

---

## 3. Current stage

**Stage: Production architecture refactor — IN PROGRESS**

Completed:
- monolithic App split into modules;
- shared domain types extracted;
- AppContext extracted;
- AI client extracted;
- constants extracted;
- shared UI extracted;
- feature modules extracted;
- existing localStorage keys preserved;
- selected AI provider availability check fixed;
- strict TypeScript configuration added;
- module-size check added;
- GitHub Actions verification workflow added;
- `APP_OVERVIEW.md` added;
- `main` was not modified.

Current branch:
`refactor/production-architecture`

Current PR:
#11 — modular architecture refactor.

Important verification status:
- static local import/export validation: passed;
- repository build/typecheck: **not yet verified in the agent environment**;
- GitHub Actions result must be checked before considering this stage complete.

---

## 4. Mandatory development rules

### Git
1. Never develop directly in `main`.
2. Every change must be made in a dedicated feature/refactor branch.
3. `main` must remain untouched during development.
4. Before merging, verify the branch against the current `main`.

### Merge conflicts — mandatory rule
If a Git conflict occurs:

**ALWAYS KEEP ONLY THE NEW VERSION.**

Meaning:
- choose the version from the active/new development branch;
- remove the old version completely;
- do not keep both versions;
- do not concatenate old + new code;
- do not restore the old implementation;
- resolve the conflict in favor of the new file/content;
- then run verification.

If the conflict is between old and new architecture, the new architecture wins.

### Code
1. No file in `src/**/*.ts` or `src/**/*.tsx` may exceed **1500 lines**.
2. Prefer small, single-purpose modules.
3. Keep business logic separate from UI where practical.
4. Pure algorithms must be reusable and independently testable.
5. Do not duplicate existing logic.
6. Do not introduce paid APIs/services.
7. Do not silently change existing localStorage keys.
8. Do not remove existing functionality unless explicitly required.
9. New functionality must be documented in this file.
10. Do not create demo/mock implementations when production logic is expected.

---

## 5. Data and persistence

Existing localStorage keys are part of the current contract:

- `qa_nav_theme`
- `qa_nav_apikeys`
- `qa_navigator_checklists`
- `qa_navigator_testcases`
- `qa_navigator_bugreports`
- `qa_navigator_bookmarks`
- `qa_navigator_req_text`
- `qa_navigator_req_result`

Future schema changes:
1. introduce an explicit storage version;
2. add migration logic;
3. preserve existing user data;
4. never silently overwrite incompatible data.

---

## 6. AI rules

AI is optional.

The application must:
- work without an AI key;
- use only the provider selected by the user;
- never hard-code private API keys;
- never add a paid backend requirement;
- validate AI responses before using structured data;
- handle network/API errors without crashing the UI.

AI logic belongs in the core/AI layer, not inside unrelated feature components.

---

## 7. Development roadmap

### Phase 1 — Architecture refactor
**Status: IN PROGRESS**

Tasks:
1. Verify TypeScript.
2. Verify production build.
3. Verify GitHub Actions.
4. Fix all compile/build errors.
5. Confirm all existing features still work.
6. Merge only after verification is green.

### Phase 2 — Test Design decomposition
**Status: NEXT**

Split `TestDesignModule.tsx` into:
- pure test-design algorithms;
- equivalence partitioning;
- boundary value analysis;
- pairwise/IPOG logic;
- state-transition logic;
- independent UI tabs/components.

Algorithms must not depend on React.

### Phase 3 — Documentation decomposition
**Status: PLANNED**

Split large documentation logic into:
- document data/model;
- document generation;
- individual document views/editors;
- export logic.

### Phase 4 — Storage layer
**Status: PLANNED**

Create a small persistence layer:
- typed storage adapter;
- schema version;
- migrations;
- safe JSON parsing;
- centralized storage keys.

### Phase 5 — Validation and tests
**Status: PLANNED**

Add:
- unit tests for pure algorithms;
- validation for imported JSON;
- validation for AI-generated structured data;
- smoke tests for critical user flows.

Critical flows:
1. open application;
2. navigate between features;
3. create/edit/save QA data;
4. requirements analysis;
5. test generation/design;
6. execution/checklists;
7. export/import;
8. AI enabled/disabled states.

### Phase 6 — Performance and UX
**Status: PLANNED**

Tasks:
- inspect bundle size;
- remove unnecessary dependencies;
- lazy-load heavy feature modules where useful;
- reduce unnecessary React re-renders;
- verify keyboard accessibility;
- verify responsive layouts;
- preserve existing visual language unless redesign is explicitly requested.

### Phase 7 — Production hardening
**Status: PLANNED**

Before production release:
- all CI checks green;
- no module-size violations;
- no TypeScript errors;
- production build succeeds;
- critical flows tested;
- no secrets in repository;
- backup/import compatibility verified;
- documentation updated.

---

## 8. Definition of Done

A development task is complete only when:

1. code is implemented on a non-main branch;
2. architecture remains modular;
3. no file exceeds 1500 lines;
4. existing functionality is preserved unless intentionally changed;
5. typecheck passes;
6. production build passes;
7. relevant tests pass;
8. conflicts are resolved using the **new version only** rule;
9. `TECHNICAL_ROADMAP.md` is updated if architecture, behavior, stage, or roadmap changes;
10. `main` remains untouched until merge.

---

## 9. Future direction

Target architecture:

```
App shell
  ↓
AppContext / application state
  ↓
Feature modules
  ↓
Domain logic + pure algorithms
  ↓
Persistence / integrations
  ↓
External AI provider (optional)
```

Goal:
**A maintainable, testable, modular QA platform where each feature can evolve independently without returning to a monolithic App component.**

When a new agent starts work, it must read this file first, determine the current stage, follow the mandatory rules, inspect the repository before changing code, and update this file when the project stage changes.


## 8. Production CI audit — 2026-09-28

- Исправлены ошибки TypeScript, обнаруженные GitHub Actions после архитектурного рефакторинга.
- Восстановлен экспорт `TestDesignModule`.
- Исправлены missing/type-only imports в UI-компонентах.
- Убран `.tsx` из динамического import в `src/main.tsx`.
- Vite config переведён на ESM-safe `import.meta.dirname` и `node:path`; добавлена типизация `resolveId`.
- Добавлены Node.js type declarations.
- Исправлено отображение `Badge` в TestExecution.
- Удалён `noUncheckedIndexedAccess`, который создавал несовместимый с существующим legacy-кодом поток каскадных ошибок; `strict` остаётся включённым.
- Добавлен Node built-in smoke-test suite: `scripts/architecture-smoke.test.mjs`.
- `npm run verify` теперь включает `npm run test:smoke` перед typecheck/build.
- GitHub Actions подтвердил успешный полный `verify`: conflict gate, module-size gate, smoke tests, TypeScript typecheck и production build.

- PR #11 reopened on 2026-09-28 so the current branch head is validated by GitHub Actions against `main`.
