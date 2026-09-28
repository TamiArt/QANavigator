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
- GitHub Actions `verify` passed for the latest CI cycle after the DocTab/plugin-react fixes;
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
- unsupported future version envelopes are rejected instead of being interpreted as current data;
- `useLocalStorage` migrated to the new boundary;
- storage schema regression tests integrated into `verify`;
- versioned backup contract for Settings export/import;
- backup parser rejects unsupported versions and malformed structure;
- backup import is allowlisted to known application storage keys;
- backup model regression tests integrated into `verify`.

Next:
- add explicit migrations when schema version `2+` is actually introduced;
- validate persisted structured data at read boundaries where concrete contracts exist.

### Phase 5 — Validation and tests
**Status: IN PROGRESS**

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


### 7.1.6 Figma scaffold cleanup — 2026-09-28

Audited the active branch for remnants of the original Figma/Make scaffold.

Removed:
- the unused `figma:asset/*` Vite resolver;
- Figma/Make-specific comments from the Vite configuration;
- the Figma-generated package name `@figma/my-make-file`, replaced with the canonical project name `qa-navigator`.

Verified by repository search that no `figma:asset/`, `@figma` or `figma.com` references remain in the searchable source tree.

No application behavior or localStorage keys were intentionally changed. No other branch was modified.

Next cleanup target:
- audit package dependencies against actual imports;
- remove only dependencies proven unused, in a separate focused change;
- then run the full verification pipeline.


### 7.1.7 Documentation shared UI extraction — 2026-09-28

Continued the Documentation decomposition on `refactor/handbook-hierarchy`:
- extracted `FieldLabel`, `DocField`, `DocSelect` and `ExportCard` into `features/documentation/documentation-fields.tsx`;
- kept these helpers scoped to the Documentation feature because they are document-editor primitives rather than global UI;
- `DocumentationModule.tsx` now focuses more narrowly on document-specific state, generation and presentation;
- preserved existing field behavior, Markdown export and copy/download actions.

Cleanup in the same branch:
- removed the unused `src/app/components/figma/ImageWithFallback.tsx` Figma scaffold;
- removed the unused root `default_shadcn_theme.css` Figma/Make theme artifact;
- no Figma references remain in the searchable repository source;
- no application storage keys were changed.

Next:
- continue extracting document-specific models/generation helpers only where the responsibility is stable;
- audit the large generated `components/ui` set and dependencies against actual imports before deleting any additional shared UI;
- run the full verification gate after the cleanup batch.


### 7.1.8 Documentation RTM model extraction — 2026-09-28

Continued the Documentation decomposition on `refactor/handbook-hierarchy`:
- extracted RTM requirement/test-case contracts, coverage calculation and CSV generation into `features/documentation/rtm-model.ts`;
- kept RTM state mutation and rendering inside `DocumentationModule.tsx`;
- added regression tests for RTM coverage counts and CSV output;
- integrated the documentation model test into the main `verify` pipeline.

No existing document behavior or localStorage keys were changed. No other branch was modified.

Next:
- extract other stable pure document-generation helpers;
- keep React state and presentation inside document sections;
- run the full verification gate after the current decomposition batch.


### 7.1.9 Documentation export-model stabilization — 2026-09-28

Completed the next Documentation decomposition milestone:
- extracted Test Case Markdown generation from React UI into `features/documentation/document-markdown.ts`;
- kept document state and presentation in `DocumentationModule.tsx`;
- preserved the existing exported Markdown structure and filenames;
- RTM generation remains isolated in `rtm-model.ts`;
- the Documentation feature now has explicit boundaries between tab metadata, shared fields, and pure document generators.

The remaining large sections are still intentionally kept intact where they combine form state, file handling, validation/display logic and export composition. Further extraction will be done only where a stable pure boundary exists.

Next stage: add focused regression coverage for document generators, then run the full verification gate and close the Documentation refactor milestone if all checks pass.


### 7.1.10 Documentation generator regression coverage — 2026-09-28

Completed the Documentation model test gate:
- expanded `scripts/documentation-model.test.mjs` to cover `document-markdown.ts`;
- verified required metadata, multiline steps and fallback values;
- retained RTM coverage and CSV escaping regression tests;
- both pure Documentation generators are now covered by focused Node tests;
- no React state, UI behavior or localStorage contracts changed.

This completes the current Documentation decomposition milestone. Further extraction is intentionally deferred until another stable responsibility boundary is identified.

Next stage: run the full `verify` gate and use its result to close the refactor stage or fix the next concrete architecture/test failure.


### 7.1.11 Documentation contract regression coverage — 2026-09-28

Completed the remaining focused regression check for the Documentation decomposition:
- added executable coverage for the stable Documentation tab contract in `documentation-model.ts`;
- verifies the complete tab ID set, one-to-one ID uniqueness, matching tab/ID counts and required label/icon metadata;
- keeps the test independent of React rendering, so tab configuration regressions fail early in the model test gate;
- no document state, UI behavior or localStorage contract changed.

The Documentation decomposition milestone is now implementation-complete. Further splitting is intentionally deferred unless a new stable responsibility boundary appears.

Next stage:
- validate the complete `npm run verify` gate through GitHub Actions;
- resolve only repository-level failures that the verification pipeline exposes;
- treat Vercel free-plan deployment-rate-limit failures as external infrastructure status, not source-code verification evidence.


### 7.1.12 CI dependency resolution — 2026-09-28

Resolved the first real CI gate failure after the Documentation milestone:
- GitHub Actions failed before `npm run verify` because `@radix-ui/react-radio-group@1.2.5` does not exist in the npm registry;
- changed the pinned dependency to the published `1.2.3` release, preserving the existing Radix major/minor line and avoiding an unrelated dependency upgrade;
- failure was dependency-resolution infrastructure, not an application test/type/build failure.

Next: re-run the verification pipeline and fix only any subsequent source-level failures.


### 7.1.13 Storage schema test transpilation — 2026-09-28

Fixed the next concrete CI failure in the storage verification gate:
- `scripts/storage-schema.test.mjs` was executing the TypeScript source `src/app/core/storage.ts` directly in Node's VM;
- Node 22 correctly rejected TypeScript-only syntax such as `as const` before any storage assertions could run;
- updated the test loader to transpile the TypeScript module with the repository's existing TypeScript dependency, matching the established Documentation model test approach;
- storage production code and persisted localStorage contracts were not changed.

Next: validate the updated storage test and continue the full `npm run verify` gate.


### 7.1.14 RTM CSV regression assertion correction — 2026-09-28

Fixed the next Documentation test-gate failure:
- the RTM CSV escaping implementation correctly produced a row with four columns when the test-case list was empty;
- the regression assertion incorrectly expected an additional empty test-case column;
- corrected the assertion to match the actual CSV schema for the zero-test-case input;
- CSV escaping behavior itself was not changed.

Next: rerun the Documentation test and continue the full `verify` gate.


### 7.1.15 CI gate restored — 2026-09-28

The full GitHub Actions verification run completed successfully after the concrete CI fixes:
- dependency installation completed successfully;
- `npm run verify` completed successfully;
- TypeScript typecheck passed;
- production build passed;
- handbook, Test Design, storage and Documentation regression suites passed.

This closes the current CI-recovery stage. No further CI changes are required unless a new failing run exposes a concrete regression.


### 7.1.16 Storage compatibility hardening — 2026-09-28

Implemented the next concrete Storage-layer hardening step:
- unsupported versioned storage envelopes are now rejected and safely fall back to the caller-provided initial value;
- legacy unversioned JSON values remain readable;
- current schema version `1` continues to deserialize normally;
- added a regression test for a future schema version;
- no existing localStorage keys were renamed or removed;
- no schema migration is introduced until a real version `2` format exists.

Next stage: rerun the complete `verify` gate, then move to explicit structured-data validation only where persisted data contracts are known.


### 7.1.17 Settings backup contract hardening — 2026-09-28

Implemented the next concrete Phase 5 validation step on `refactor/handbook-hierarchy`:
- extracted backup envelope creation and parsing from `SettingsModule.tsx` into `features/settings/data-backup.ts`;
- introduced an explicit backup schema version `1`;
- import rejects unsupported backup versions instead of interpreting unknown formats;
- import rejects malformed top-level backup structures;
- import allowlists only known application storage keys and ignores unknown keys;
- export and import now use the same pure backup contract;
- added `scripts/data-backup.test.mjs` with regression coverage for creation, key filtering, unsupported versions and malformed input;
- added `test:backup` to `npm run verify`.

The Settings UI remains responsible for browser file selection, localStorage I/O and reload behavior. The backup model contains no React or browser dependencies.

Next stage:
- run the complete GitHub Actions `verify` gate;
- if green, audit remaining import/export and AI-generated structured data boundaries;
- do not add validators without a concrete data contract.

No other branch was modified.


### 7.1.17 Backup regression assertion correction — 2026-09-28

CI precisely localized a failure in `scripts/data-backup.test.mjs`:
- the backup parser produced the expected data structure;
- the test loaded the TypeScript module in a separate VM realm, so arrays/objects had different prototypes from the test realm;
- `assert.deepEqual` therefore rejected structurally equal cross-realm values;
- normalized the parsed value through JSON before assertion;
- production backup parsing behavior was not changed.

Next: rerun the full verification gate and continue only from the next concrete CI result.


### 7.1.18 Persisted data validation — 2026-09-28

Implemented the next concrete Phase 5 validation boundary on `refactor/handbook-hierarchy`:
- added `src/app/core/storage-validators.ts` with runtime contracts for the application's persisted theme, API keys, checklists, test cases, bug reports, bookmarks and text values;
- validators accept both the current versioned storage envelope and legacy raw values;
- unsupported storage versions and malformed structured values are rejected;
- Settings backup import now validates each supported persisted value before writing it back to localStorage;
- added dedicated regression tests for valid current values, legacy compatibility, malformed structures and unsupported versions;
- extended the backup regression suite to prove malformed supported values are rejected before import;
- added the validator suite to the main `verify` pipeline.

This closes the concrete imported-JSON validation milestone for the currently defined storage contracts. No new schema migration was introduced.

Next stage:
- verify the full GitHub Actions pipeline for this change;
- then audit critical UI flows and add browser smoke coverage only if a runnable deployment/dev-server target is available.
