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
`refactor/handbook-hierarchy`

Current PR:
#12 — handbook hierarchy and test-design decomposition.

Verification baseline:
- GitHub Actions `verify` passed for commit `41412e1c` after the latest TypeScript export fix;
- subsequent storage-layer commits are awaiting their own CI run;
- Vercel may independently report a build-rate-limit failure; this is external to the repository verification pipeline.

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
**Status: IN PROGRESS**

Implemented:
- versioned persistence boundary in `src/app/core/storage.ts`;
- schema version `1` envelope for new writes;
- backward-compatible reads of legacy raw JSON values;
- safe fallback for invalid JSON;
- `useLocalStorage` migrated to the new boundary;
- storage schema regression tests integrated into `verify`.

Next:
- centralize storage key definitions;
- add explicit migrations for future schema versions;
- validate persisted structured data at read boundaries.

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


## 7.1 Handbook hierarchy refactor

**Status: IN PROGRESS**

The QA Knowledge Base is being reorganized into a learning hierarchy without deleting or shortening existing educational content.

Current hierarchy:

1. Foundations
2. Requirements and lifecycle
3. Testing levels, types and cycles
4. Test design
5. Web testing
6. API testing
7. Databases and test data
8. Environments and release
9. Test documentation and defects
10. Automation and CI/CD
11. QA tools and DevOps
12. Specialized testing

Implementation rules:
- Existing topic text and meaning are preserved.
- Existing topic IDs are preserved for compatibility with bookmarks and other stored references.
- Curriculum order is separated from topic content.
- Hierarchy metadata is kept in `src/app/handbook-hierarchy.ts`.
- The handbook UI displays section boundaries while search, level filters and bookmarks continue to work against the same topic records.
- Existing merged topics remain governed by `MERGED_TOPIC_IDS` and are not duplicated in the visible list.
- Further content consolidation must be performed only after exact source text is inspected and verified; do not delete content merely because topics overlap.

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


### 7.1.1 Handbook consolidation — 2026-09-28

Completed on `refactor/handbook-hierarchy`:

- merged the full `auto4` CI/CD content into `auto3`;
- merged the full `git2` branching / Pull Request content into `git1`;
- merged the full `web10` QA tooling content into `tools1`;
- preserved the source educational text while removing the merged duplicate topic IDs from the visible curriculum;
- updated hierarchy descriptions and canonical titles for the consolidated topics;
- added `scripts/handbook-hierarchy.test.mjs` to verify topic coverage, uniqueness, curriculum order and merged-topic exclusion;
- added `test:handbook` to the verification pipeline.

No other branch was modified.


### 7.1.2 Test Design decomposition — 2026-09-28

Implemented on `refactor/handbook-hierarchy`:

- extracted Pairwise/IPOG, Equivalence Partitioning and State Transition generators into `src/app/features/test-design/algorithms.ts`;
- extracted Boundary Value Analysis (BVA) model and generator into the same pure algorithms layer;
- exported algorithm contracts explicitly so the UI module depends on reusable logic rather than local implementations;
- kept `TestDesignModule.tsx` as the React/UI layer; current size is below the 1500-line project limit;
- added executable algorithm tests using the existing TypeScript dependency and Node's built-in test runner;
- added the Test Design test suite to the main `verify` pipeline.

No other branch was modified.


### 7.1.3 Decision Table extraction — 2026-09-28

Continued on `refactor/handbook-hierarchy`:

- extracted Decision Table combination generation, action-matrix normalization and test-case text generation into `test-design/algorithms.ts`;
- kept the React component responsible for state, editing and presentation only;
- added executable coverage for Decision Table helpers;
- `TestDesignModule.tsx` remains below the 1500-line limit.

No other branch was modified.


### 7.1.4 Persistence boundary — 2026-09-28

Implemented on `refactor/handbook-hierarchy`:

- added `src/app/core/storage.ts` as the persistence serialization boundary;
- introduced storage schema version `1`;
- new writes use a versioned `{ version, data }` envelope;
- legacy raw JSON values remain readable, so existing user data is not invalidated;
- invalid JSON safely falls back to the caller-provided initial value;
- updated `useLocalStorage` to use the versioned boundary;
- centralized all existing persistence keys without renaming them;
- added `scripts/storage-schema.test.mjs` and integrated it into `verify`.

No existing localStorage keys were renamed or removed. No other branch was modified.


### 7.1.5 Documentation decomposition — 2026-09-28

Started on `refactor/handbook-hierarchy`:
- extracted the documentation tab model into `features/documentation/documentation-model.ts`;
- tab IDs, labels and icon contracts are now separated from the large UI module;
- `DocumentationModule.tsx` consumes the shared tab model while retaining presentation and document-specific state.

Next:
- extract reusable document-field/export helpers;
- separate document data models from rendering;
- split the largest document sections only where a stable responsibility boundary exists;
- keep every resulting module below the 1500-line limit;
- add regression coverage for document tab availability and export formatting.
