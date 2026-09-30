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


### 7.1.19 Critical navigation contract — 2026-09-29

Implemented the next Phase 5 regression boundary:
- extracted the application's canonical navigation list into `src/app/domain/navigation.ts`;
- App UI now derives labels and icon rendering from that single contract instead of maintaining a second navigation list;
- added `scripts/navigation-contract.test.mjs` to verify all 11 application modules are present exactly once and have non-empty labels;
- added the navigation test to the main `verify` gate.

This closes the static navigation-integrity milestone. Browser smoke testing remains dependent on access to a runnable deployment; the deployment URL recorded in PR #12 is not currently accessible through the connected Vercel integration.


---

## 10. Product evolution — QA Assistant

### Architecture constraint — AI is optional, not required

QA Navigator must remain fully useful without AI.

Mandatory constraints:
- no paid API or paid backend is required for core functionality;
- no local LLM installation is required;
- no Ollama, LM Studio or similar local model runtime is required;
- the application must work in a normal browser using its local QA engine;
- AI is an optional accelerator, available only through a user-provided external provider/API when configured;
- core QA logic must never depend on an AI response;
- structured AI output must be validated before entering application state;
- if AI is unavailable, the same QA task must remain possible through deterministic rules, generators, templates and user input.

Target architecture:

```
QA Navigator
│
├── QA CORE ENGINE
│   ├── requirements analysis
│   ├── test design
│   ├── test cases
│   ├── test data
│   ├── execution
│   ├── bugs
│   ├── traceability
│   └── reports
│
└── OPTIONAL AI LAYER
    └── user-provided external provider
```

The AI layer may improve suggestions, explanations and generation quality, but it must not become a mandatory runtime dependency.

### Product goal

Evolution target:

```
Collection of QA tools
        ↓
Shared QA workspace
        ↓
QA work environment
        ↓
QA Assistant
        ↓
Optional AI-enhanced QA Assistant
```

The assistant is not a separate chatbot placed beside the existing tools. It is a common layer over the same project data and QA workflow.

### Development roadmap

#### Stage A — Project Context & QA Workspace
**Goal:** give all QA modules one shared project context.

Simple meaning:
- create a QA project;
- store project name, product/version and basic context;
- make requirements, test cases, bugs, execution results and other artifacts belong to a project;
- allow modules to reuse the same project data instead of working as isolated tools;
- keep the first implementation local/browser-based.

Expected result:
**the user can open one project and see all QA work connected to it.**

#### Stage B — QA Assistant shell
**Goal:** create the assistant's central working area.

Simple meaning:
- show the current project context;
- show what QA work already exists;
- provide actions such as “analyze requirement”, “create tests”, “prepare test data”, “check coverage”;
- initially these actions use the deterministic QA core, not AI.

Expected result:
**the app starts behaving like an assistant, even with AI completely disabled.**

#### Stage C — Requirement Intelligence
**Goal:** automatically find problems in requirements using deterministic rules.

Simple meaning:
- detect empty or incomplete requirements;
- find ambiguous wording where rules can identify it;
- detect missing acceptance criteria;
- identify missing actors, inputs, outputs or expected behavior where applicable;
- show exactly why a requirement needs attention.

Expected result:
**the tester gets a structured requirement-quality report instead of only a text-analysis box.**

#### Stage D — Test Design Assistant
**Goal:** turn requirements into appropriate test-design work.

Simple meaning:
- determine which test-design techniques fit the requirement;
- generate equivalence classes;
- generate boundary values;
- generate decision tables;
- generate state-transition cases;
- generate pairwise combinations where appropriate;
- explain which technique was selected and why.

Expected result:
**the tester can move from requirement → test ideas without manually rebuilding the same data.**

#### Stage E — Test Case Factory
**Goal:** convert test ideas into usable test cases.

Simple meaning:
- generate structured test cases from selected scenarios;
- reuse project conventions and templates;
- connect each test case to its source requirement;
- detect duplicate or nearly duplicate cases;
- allow editing before saving.

Expected result:
**test cases become reusable project artifacts rather than temporary generated text.**

#### Stage F — Traceability & Evidence
**Goal:** connect the whole QA chain.

Simple meaning:
- requirement → test case;
- test case → execution;
- execution → bug;
- requirement → coverage;
- keep evidence and notes connected to the relevant artifact.

Expected result:
**the tester can answer “what was tested, why, and what happened?” without searching through separate modules.**

#### Stage G — Test Execution Workspace
**Goal:** make QA Navigator useful during an actual test cycle.

Simple meaning:
- create test runs;
- execute selected test cases;
- record passed/failed/blocked results;
- attach notes/evidence;
- create or link bugs directly from failed tests;
- calculate execution progress.

Expected result:
**the application can be used during real manual testing, not only during test preparation.**

#### Stage H — Bug Assistant
**Goal:** make bug reporting faster and more consistent.

Simple meaning:
- create a bug from a failed test;
- reuse steps, expected result and actual result;
- validate required bug fields;
- detect obvious missing information;
- keep the bug connected to the test and requirement.

Expected result:
**a failed test can become a structured bug report without copying information manually.**

#### Stage I — Risk Engine
**Goal:** help the tester decide where attention is needed based on transparent rules.

Simple meaning:
- calculate risk indicators from impact, priority, coverage, failures and other explicit project data;
- show the factors behind each indicator;
- never hide the calculation behind an unexplained AI score.

Expected result:
**the tester can see which areas require additional testing and why.**

#### Stage J — Release Assistant
**Goal:** assemble the QA state into a release picture.

Simple meaning:
- show execution progress;
- show pass/fail/blocked results;
- show open bugs by severity/priority;
- show requirement coverage;
- show known risks;
- generate a structured release report.

Expected result:
**the tester can prepare a release QA summary from project data instead of collecting it manually.**

#### Stage K — Optional AI Grounding
**Goal:** add AI only after the deterministic core is useful on its own.

Simple meaning:
- send only the necessary project context to the user-selected external provider;
- ask AI for suggestions, alternative test ideas, explanations or review;
- validate returned structured data;
- never make AI-generated content silently become trusted project data.

Expected result:
**AI makes the assistant more helpful, but the product still works when the API key is absent, unavailable or the provider fails.**

#### Stage L — Knowledge Assistant
**Goal:** connect the QA handbook to the current task.

Simple meaning:
- explain QA concepts in simple language;
- point the tester to relevant handbook topics;
- explain why a technique is useful for the current requirement;
- eventually use project context to make explanations more relevant.

Expected result:
**the application can act as both a work tool and a learning assistant.**

#### Stage M — API / Web Assistant
**Goal:** extend the assistant from project artifacts to real application checks.

Simple meaning:
- help prepare API test scenarios;
- inspect HTTP requests/responses supplied by the user;
- generate checks and test data;
- support repeatable manual API testing workflows.

Expected result:
**QA Navigator becomes useful for practical web/API testing, not only documentation.**

#### Stage N — Automation Assistant
**Goal:** prepare the tester for automation without making automation mandatory.

Simple meaning:
- generate automation-ready scenarios from existing test cases;
- suggest selectors/assertions/test structure where deterministic rules allow;
- optionally generate code through the external AI layer;
- keep generated automation reviewable before use.

Expected result:
**manual testing artifacts can become a starting point for automation.**

### Order of implementation

The order is intentional:

1. **Project Context** — first connect the data.
2. **Assistant shell** — then connect the user experience.
3. **Requirement Intelligence** — understand what needs testing.
4. **Test Design** — derive test ideas.
5. **Test Case Factory** — turn ideas into artifacts.
6. **Traceability** — connect artifacts.
7. **Execution** — use them during testing.
8. **Bug Assistant** — close the failure loop.
9. **Risk Engine** — prioritize attention using transparent rules.
10. **Release Assistant** — summarize the whole project.
11. **Optional AI** — accelerate the mature workflow.
12. **Knowledge/API/Automation assistants** — extend the product.

This sequence prevents the project from becoming a collection of disconnected AI features.

### Immediate implementation milestone

**Next development milestone: Stage A — Project Context & QA Workspace.**

Before changing application behavior, inspect:
- `src/app/domain/types.ts`;
- `src/app/core/app-context.tsx`;
- `src/app/core/constants.ts`;
- current Project Workspace models;
- Requirements models;
- Test Execution models;
- Documentation models;
- existing localStorage boundaries.

Then introduce the smallest stable project-context contract and regression tests before integrating it into UI.

The first milestone must preserve all existing localStorage keys and existing feature behavior.



## 7.1.20 Handbook learning mode — 2026-09-29

Implemented the first learning-mode slice without changing the approved curriculum.

Scope:
- added a dedicated **Режим обучения** entry point to the existing QA Knowledge Base;
- added exactly **Module 1. Теория тестирования**;
- added exactly the 10 user-approved lessons, in the requested order;
- reused only existing handbook material already present in the repository;
- for SDLC, Severity vs Priority, and Test Pyramid, configured bounded content extraction so unrelated neighboring material is not shown in the lesson;
- grouped the existing test-design topics under the single approved Module 1 lesson;
- added local, versioned learning progress storage;
- added previous/next navigation and explicit completion state;
- kept the existing handbook search, filters, bookmarks, hierarchy and topic IDs unchanged.

No additional learning topics were introduced.

Regression coverage:
- exact Module 1 lesson titles and count;
- no Module 2–5 content introduced;
- bounded-section configuration for topics containing adjacent material;
- learning progress storage key contract.

The learning mode is intentionally separate from the existing reference-mode UI so the handbook remains usable as both a reference and a sequential course.


### 7.1.21 Module 1 STLC lesson — 2026-09-29
Added the user-requested **STLC: Жизненный цикл тестирования ПО** lesson directly after SDLC. The lesson reuses only the existing STLC section already present in the f6 handbook topic; no new external theory was introduced. Module 1 now contains 11 lessons.


### 7.1.22 Module 2 learning materials — 2026-09-29

Extended the separate Handbook learning mode with **Module 2. Погружение в контекст** using the user's supplied curriculum and study material.

Implemented:
- kept the exact Module 2 topic order:
  1. Что такое стек проекта?
  2. Команда проекта
  3. Методологии разработки: как организовать работу над проектом
  4. Scrum
  5. Спринт
  6. Покер планирования
  7. Ретроспектива
  8. Видео мероприятий Scrum
  9. Видео о методологиях
  10. Kanban
  11. Смешанные модели
  12. Типы компаний;
- added the supplied project-stack, team-role, methodology, Scrum, Sprint, Planning Poker, retrospective, Kanban and hybrid-model material;
- placed Shift-Left Testing inside the Methodologies lesson;
- included the supplied V-Model, Spiral, Iterative, Agile, Scrum, Kanban, Scrumban and Kanplan comparison material in the Methodologies lesson;
- kept the two video lessons and Type of Companies lesson in the curriculum without inventing missing source material;
- moved Module 2 learning content into a dedicated handbook-learning-module2.ts file to keep responsibilities modular;
- added module selection to the learning-mode UI while preserving the existing Module 1 order and progress storage;
- added regression coverage for Module 2 title/order/content anchors.

No Module 3–5 topics were introduced.


### 7.1.23 Module 3 learning materials — 2026-09-29

Extended the separate Handbook learning mode with **Module 3. Тестирование фронтенда** using the user's supplied curriculum and material.

Implemented:
- kept the exact seven Module 3 topics and their order:
  1. Что такое фронтенд и бэкенд
  2. Тестовые окружения (стенды)
  3. Тестирование фронтенда
  4. Мини-гайд по тестированию GUI
  5. HTML
  6. CSS
  7. DevTools — главный инструмент;
- added the supplied frontend/backend/API interaction and Network-based bug localization material;
- added Dev/QA-Stage/Integration/Preprod/Prod environment guidance;
- added frontend, GUI, HTML and CSS QA checklists;
- added the supplied DevTools, HTTP status-code and troubleshooting flow;
- preserved the learning-mode curriculum as a separate sequential layer over the reference Handbook;
- added regression coverage for Module 3 topic count, exact order and key content anchors.

The source states that frontend/backend percentages are project-dependent; the material therefore does not treat 20%/80% as a universal rule.

No Module 4 or Module 5 topics were introduced.


### 7.1.24 Module 4 learning materials — 2026-09-29

Extended the separate Handbook learning mode with **Module 4. Тестовая документация** using the user's supplied curriculum and study material.

Implemented:
- kept exactly four Module 4 topics in the supplied order:
  1. Что такое тестовая документация?
  2. В чем важность тестовой документации?
  3. Тест-план (Test Plan)
  4. Тест-кейс (Test Case);
- added the supplied explanation of the purpose and value of test documentation;
- added the eight key documentation types: Test Strategy, Test Plan, Test Case, Test Scenario, RTM, Test Data, Bug Report and Test Summary Report;
- added the Test Plan structure with eight parts, entry/exit criteria, resources, procedures, prerequisites and risks;
- added the supplied travel-app Test Plan example;
- added Test Case types, atomicity, regression use and the full field structure;
- added a minimal Test Case example and exam-ready summaries;
- connected Module 4 to the existing sequential learning-mode module selector;
- added regression coverage for exact topic count, order and key documentation/test-case anchors.

No Module 5 topics were introduced.


### 7.1.25 Module 4 extension: API test cases and checklists — 2026-09-29

Extended Module 4 with the user's additional study material, preserving the existing four topics and appending exactly three new topics in order:

1. Тест-кейсы для бэкенда и API
2. Чек-лист (Checklist)
3. Тест-кейсы vs Чек-листы — что и когда выбирать

Implemented:
- backend/API testing focus: API contract, HTTP methods/endpoints, response statuses and structure, business logic, error handling, Kafka and database checks;
- API test-case documentation rules and a concrete API + Kafka + DB example;
- checklist definition, use cases, advantages, limitations and a real analytical-report checklist example;
- checklist wording variants;
- detailed Test Case vs Checklist comparison and context-based selection;
- hybrid approach for critical versus routine checks;
- exam-ready rules and guidance for time-constrained testing.

A factual correction was applied to the supplied API example: HTTP **201 Created** is used instead of the technically incorrect “201 OK”.

Regression coverage now checks all seven Module 4 topics, their exact order, and key API/checklist anchors.


### 7.1.26 Module 4 extension: Bug Report, Test Summary Report and defect classification — 2026-09-29

Extended **Module 4. Тестовая документация** with the next three user-supplied topics, appended after the existing seven topics:

8. Баг-репорт (Bug Report)
9. Пример отчета по тестированию (Test Summary Report)
10. Баг, ошибка, дефект и их классификация

Implemented:
- added the Bug Report definition, purpose, developer-oriented writing rule, minimum structure, reproduction example and practical writing advice;
- added the Test Summary Report example with project context, testing goals, methods, tools, environment, checklists and testing results;
- added the Error → Defect/Bug distinction and examples;
- added common reasons why defects occur;
- added Severity classification: Blocker, Critical, Major, Minor and Trivial;
- added Priority classification: High, Medium and Low;
- explicitly separated Severity (impact) from Priority (urgency);
- preserved the existing seven Module 4 topics and their order;
- kept the module as a strict sequential learning curriculum with no Module 5 topics introduced;
- extended the handbook-learning regression test to assert all 10 Module 4 topics, exact order, count and key Bug Report/Test Summary/Severity/Priority anchors.

Where severity definitions or priority policies vary between teams, the lesson states that the project-specific rules take precedence.


### 7.1.27 Module 4 extension: defect lifecycle, documentation workflow and bug localization — 2026-09-29

Extended Module 4 with the next seven user-supplied topics, preserving all previous topics and their order:

11. Жизненный цикл дефекта (Bug Life Cycle)
12. Баг vs задача на доработку (Feature Request)
13. Основные шаги документирования дефекта
14. Pre-release баг и Production Bug
15. Где ведут тестовую документацию
16. Локализация багов
17. Работа с задачей при написании тестовой документации

Implemented:
- documented the full defect lifecycle from New through Closed, Reopened, Rejected, Deferred and Duplicate;
- separated defects from feature requests;
- documented a practical defect-reporting sequence and a complete example;
- explained differences between pre-release and production defects;
- documented common categories of test-documentation storage and management tools;
- added a step-by-step bug-localization algorithm using reproduction, DevTools, Network/Console, database checks and logs;
- documented QA work with a task from requirements clarification through test design, test-case writing and review;
- added test-case best practices: clear naming, expected results, test-data references, design links, priority and atomicity;
- extended the regression test to cover all 17 Module 4 topics and key anchors;
- kept the learning curriculum sequential and did not introduce Module 5.

As with earlier lessons, the material notes that concrete workflows, statuses and tools vary by company and project.


### 7.1.28 Module 4 exam-focused consolidation and test-case best practices — 2026-09-29

Added the user-supplied exam-oriented consolidation layer to Module 4 without changing the existing topic order.

Added topic 18:
18. Лучшие практики тест-кейсов

The lesson includes:
- the universal learning/answering formula: **Что это? → Зачем? → Из чего состоит? → Пример**;
- practical rules for test-case naming, steps, test data, design links, priority and atomicity;
- a detailed example of a structured oral exam answer;
- the 12-item “most important cheat sheet”;
- 15 short phrases to memorize;
- the final one-line map: documentation → plan → case → checklist → bug report → severity → priority → retest → localization → feature request.

The existing 17 Module 4 topics remain unchanged in order; the new lesson consolidates and reinforces them rather than replacing their detailed material. Regression coverage was extended from 17 to 18 topics and checks the new exam anchors.


### 7.1.29 Telegram Mini App CSP hardening — 2026-09-29

Verified the reported Telegram WebView console output against the current branch.

Confirmed repository-side issue:
- src/styles/fonts.css imported Google Fonts from https://fonts.googleapis.com/.
- Telegram Mini App WebViews can enforce style-src 'self' 'unsafe-inline', which blocks that external stylesheet.
- Removed the external import so the application no longer depends on a third-party stylesheet and falls back to the existing local/system font stack.

Telegram SDK messages were also traced:
- web_app_request_theme, web_app_request_viewport, safe-area requests, web_app_ready, and web_app_expand are Telegram WebView initialization messages, not application errors.
- The Header color is not supported in version 6.0 and Background color is not supported in version 6.0 warnings originate from Telegram's injected WebApp SDK. The repository contains no direct Telegram.WebApp.setHeaderColor / setBackgroundColor call and no Telegram WebApp SDK dependency, so these warnings are not currently attributable to repository code and should not be fixed by inventing an app-side workaround.

No Telegram API behavior was changed without a repository-side call to modify.


### 7.1.30 Stage A project context foundation — 2026-09-30

Started the immediate **Stage A — Project Context & QA Workspace** milestone.

Implemented:
- introduced a stable `QAProject` domain contract in `src/app/domain/project.ts`;
- extracted project creation, update, removal and active-project resolution into pure, reusable domain functions;
- centralized the existing project localStorage keys under `STORAGE_KEYS` without renaming them;
- added runtime validation for persisted projects and the active-project ID;
- moved project state into the global AppContext so the Workspace is no longer a second independent persistence boundary;
- preserved the existing project creation, selection and deletion behavior while making the active project available to all future feature modules;
- added executable regression coverage for project-domain operations and project persistence validation;
- integrated the project-context test into `npm run verify`.

Compatibility:
- existing `qa_navigator_projects` and `qa_navigator_active_project` storage keys remain unchanged;
- legacy raw JSON remains readable through the existing storage boundary;
- no existing QA artifact storage keys were changed;
- `main` remains untouched.

Next Stage A slice:
- connect project identity to requirements, test cases, executions and defects without breaking existing stored artifacts;
- add project-scoped derived metrics to the Workspace only after the artifact ownership contract is established.


### 7.1.31 Build regression — HandbookModule JSX escape corruption — 2026-09-30

Fixed a concrete Vite/esbuild build failure in `src/app/features/handbook/HandbookModule.tsx`.

Root cause:
- a generated edit had inserted literal `\\n` sequences into JSX markup instead of real line breaks;
- the resulting source contained a backslash immediately before JSX content, so esbuild reported `Expected ">" but found "\\"` at the affected `<div>` block.

Fix:
- restored the affected JSX block as valid multiline JSX;
- preserved the learning-mode button and surrounding handbook UI behavior;
- no curriculum/content changes were made.

The fix is isolated to the syntax corruption reported by the deployment build.


### 7.1.32 CI test regression — Module 4 Kafka topic assertion — 2026-09-30

Investigated the reported `npm run verify` failure in the extended Module 4 learning test.

Root cause was localized to the regression test, not the handbook content:
- the test used `/create\\.payment/`, which requires a literal backslash before the dot;
- the documented topic is correctly `create.payment` and contains no backslash;
- therefore the assertion could never match the valid source text.

Fix:
- replaced the ambiguous regular-expression assertion with an exact `source.includes("create.payment")` contract assertion;
- kept the Kafka topic documentation unchanged;
- retained the existing Module 4 title/order/count and content assertions.

Additional verification performed:
- inspected all current `scripts/*.test.mjs` files for similar escaping patterns;
- inspected the current navigation contract and project-context tests;
- confirmed no Git conflict markers in the repository search;
- confirmed the branch remains `refactor/handbook-hierarchy` and PR #12 targets `main` without modifying `main`.

Execution limitation:
- the current environment cannot resolve `github.com` for a local clone, and GitHub reports no workflow run associated with the new head commit yet; therefore a new remote `npm run verify` result is not claimed until GitHub/Vercel executes it.

### 7.1.33 CI regression — cross-realm project-domain assertions — 2026-09-30

Investigated the next failure exposed after the Module 4 test was corrected.

Root cause:
- `scripts/project-context.test.mjs` transpiled TypeScript and executed it with `vm.runInNewContext`;
- returned objects and arrays therefore belonged to a separate JavaScript realm;
- Node's strict `assert.deepEqual` rejected values with identical structure because their prototypes came from different realms;
- the project-domain implementation itself returned the expected normalized data.

Fix:
- changed the test loader to compile and execute the transpiled CommonJS module through Node's `Module` in the host realm;
- preserved the existing assertions so they continue to verify actual object structure rather than weakening them with serialization-based comparisons.

No production project-domain behavior was changed.

### 7.1.34 TypeScript regression — Markdown backticks inside Module 4 template literals — 2026-09-30

Investigated the TypeScript failures exposed after the project-context test loader was corrected.

Root cause:
- several Module 4 lesson bodies are stored as TypeScript template literals;
- the lesson content also contains Markdown inline-code spans and fenced code blocks using backticks;
- unescaped backticks prematurely terminated those template literals and caused the cascade of TS1127/TS1005/TS1109/TS17002 syntax errors reported by `tsc`.

Fix:
- escaped the 34 raw Markdown backticks inside Module 4 template-literal lesson bodies;
- kept the rendered Markdown content semantically unchanged;
- did not alter the Module 4 curriculum or lesson order.

### 7.1.35 TypeScript regression — literal \\n sequences in HandbookModule JSX — 2026-09-30

Investigated the remaining `tsc` failure after Module 4 template-literal syntax was corrected.

Root cause:
- `src/app/features/handbook/HandbookModule.tsx` contained a generated JSX header block with literal `\\n` text instead of actual line breaks;
- TypeScript parsed the backslash characters as invalid JSX content and reported TS1127/TS1382/TS17002 plus cascading syntax errors.
- the only other `\\n` occurrence in the file is inside an intentional JavaScript template literal used to build searchable text and is valid.

Fix:
- restored the affected header block as real multiline JSX;
- preserved the learning-mode button and surrounding UI behavior;
- verified the corrupt block is isolated rather than replacing valid template-literal escapes globally.

### 7.1.36 TypeScript regression — malformed Module 4 array separator and readonly lesson collections — 2026-09-30

Investigated the remaining `tsc` errors after the JSX and template-literal fixes.

Two independent issues were localized:

1. `src/app/features/handbook/handbook-learning-module4.ts` contained a stray `},,` between lessons 7 and 8. The extra comma creates an `undefined` element in the array, which caused the array to be inferred as a union containing `undefined`.
2. `LearningModule.lessons` in `handbook-learning.ts` was mutable (`LearningLesson[]`) while Module 2–4 lesson constants are intentionally readonly arrays.

Fixes:
- removed the stray array separator;
- changed `LearningModule.lessons` to `readonly LearningLesson[]` so the module contract matches the existing immutable lesson collections.

No lesson content or curriculum order was changed.


### 7.1.37 Learning Mode visual infographic style standard — 2026-09-30

Defined the reusable visual standard for all future Learning Mode lesson infographics.

Style contract:
- premium educational IT infographic / visual learning cheat sheet;
- vertical portrait format, approximately 2:3;
- white or very light background;
- clean flat-vector illustration with a subtle paper/card aesthetic;
- modular information architecture using rounded rectangular cards;
- thin borders, very light pastel card backgrounds and minimal shadows;
- dark navy headings with prominent blue numbered section markers;
- secondary soft pastel palette: blue, lavender, mint, pale yellow, light pink and soft orange;
- modern rounded/geometric sans-serif typography in the style of Manrope, Inter, Nunito Sans, Rubik or Montserrat;
- friendly flat educational vector illustrations that support the concept without competing with text;
- consistent outline/flat-fill icon set with matching stroke width and visual weight;
- diagrams, flowcharts, cycles, timelines, comparison tables and visual models used to turn complex concepts into understandable structures;
- concise educational text: information must be compressed visually while preserving the full meaning;
- optional labels such as «Важно», «Суть», «Пример» and «Где применяется»;
- a compact «Шпаргалка» summary area may be used for final revision.

Language and content rules:
- primary infographic text is strictly Russian Cyrillic;
- English is allowed only for professional terms such as API, QA, Test Case and Bug Report;
- the infographic must explain and model the topic visually rather than merely decorate the lesson;
- the target feeling is: «Сложную IT-тему разложили на одну красивую, понятную страницу».

Explicit exclusions:
- no photorealism;
- no 3D rendering;
- no glassmorphism;
- no dark backgrounds;
- no excessive gradients;
- no heavy shadows;
- no excessive decorative elements;
- no corporate-presentation visual style.

This standard is a reusable design contract for future Module 1–4 and subsequent Learning Mode infographic creation. It does not itself create or replace any infographic assets.


### 7.1.38 Learning Mode lesson infographics — 2026-09-30

Implemented the complete infographic presentation layer for Learning Mode without changing lesson content.

Completed:
- added `src/app/features/handbook/LearningInfographic.tsx` as a reusable visual layer;
- added a dedicated module overview infographic for every Learning Mode module;
- added an individual infographic definition for all 48 existing lessons across Modules 1–4 (11 + 12 + 7 + 18);
- used topic-specific visual models: flows, layers, cycles, comparisons, checklists, networks, timelines and pyramids;
- kept all existing lesson text, titles, order and IDs unchanged;
- integrated module and lesson infographics into `HandbookLearningMode.tsx`;
- added regression coverage requiring an infographic definition for every lesson ID and verifying both infographic levels are rendered.

The infographic layer is presentation-only: it does not replace, rewrite or mutate educational lesson content.
