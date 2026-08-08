Act as a Senior Principal Full-Stack Engineer and Lead UI/UX Designer. Build a complete, fully functional single-page web application named "QA Navigator" (Навигатор тестировщика) designed to help QA engineers go through the full Software Testing Life Cycle (STLC) — from requirement analysis to test automation.

The app must be built with Next.js (React), Tailwind CSS, Lucide React icons, and Shadcn UI components. It will be deployed on Vercel and must be 100% free and client-side driven without requiring a custom backend or database.

---

### 1. CORE ARCHITECTURE & INFRASTRUCTURE
- **AI Engine Integration:** Integrate with free OpenRouter models (`:free`) and Google AI Studio (`gemini-2.5-flash` or newer) via standard REST API calls.
- **Client-side Storage:** Store all user data (projects, checklists, test cases, bug reports, automated test scripts, and API keys) in browser `localStorage` or `IndexedDB`.
- **API Key Management:** Provide a Modal/Settings drawer where users enter their OpenRouter and Google Gemini API keys. Save keys locally in `localStorage` with a status indicator (Connected/Disconnected) in the header. Include a step-by-step guide inside the modal on how to get free keys in 2 minutes.
- **Serverless Proxy:** Use a Next.js Serverless API Route (`/api/generate`) to safely relay requests to AI providers and avoid CORS issues.

---

### 2. UI/UX DESIGN & BRANDING
- Clean, modern, responsive Dashboard layout (Desktop & Mobile friendly).
- Dark/Light mode toggle with state persistence.
- Left Sidebar for navigation:
  1. 🧠 Requirement Analysis (Анализ требований)
  2. 📝 Test Design (Чек-листы и Тест-кейсы)
  3. 🚀 Test Execution & Bugs (Рассран и Баг-репорты)
  4. 🤖 Test Automation (Автотесты и Инструкции)
  5. 📊 Release Report (Релизный отчет)
  6. 🛠 Test Data Generator (Генератор данных)
  7. ⚙️ Settings (Настройки)
- Tooltips everywhere to explain QA terminology (Severity, Boundary Values, ISO 25010, POM, Expected Result) for beginner QA engineers.

---

### 3. THE FULL STLC MODULES (CORE FEATURES)

#### Module 1: Requirement Analysis (Анализ требований)
- User inputs a feature description or task requirements from Jira.
- AI analyzes the text against ISTQB CTFL v4.0 and ISO/IEC 25010 standards.
- Output: Identified logical gaps, ambiguities, edge-case risks, and a Risk-Based Testing strategy recommendation.

#### Module 2: Test Design & Artifact Generator (Тест-дизайн)
- **Presets:** Quick-start templates for common components: "Input Form", "Login/Register", "Button/CTA", "Payment", "Search/Table", "Custom Feature".
- **Wizard Mode:** Step-by-step 3-question flow to define field rules, constraints, and business logic.
- **Checklist Generator:** Outputs structured checks organized by: Positive, Negative, Boundary Values, and Non-functional (Performance/Security/Usability per ISO 25010).
- **One-click Test Case Expansion:** Next to any checklist item, add a button "Expand to Test Case" that generates a full test case format: ID, Title, Preconditions, Steps (1-2-3), Expected Result, and Priority (P1-P3).

#### Module 3: Test Execution & Defect Tracking (Выполнение тестов и Баги)
- Interactive checklist execution with status buttons: `Passed`, `Failed`, `Blocked`.
- **Auto-Bug Report:** Clicking `Failed` automatically triggers a modal generating a standardized Bug Report: Title, Environment, Steps to Reproduce, Actual Result, Expected Result, and Severity/Priority.
- Export bug reports instantly in Jira/YouTrack Markdown format.

#### Module 4: Test Automation Generator (Автоматизация)
- Convert any Test Case or Checklist item into executable code in 1 click.
- **Stack Selector:** 
  - Python + Playwright / Selenium
  - JavaScript/TypeScript + Playwright
  - Java + JUnit 5
  - C# + NUnit
- Architecture: Code must follow the **Page Object Model (POM)** pattern.
- **Beginner Setup Guide:** Alongside the code, generate a CLI/Terminal step-by-step instruction on how to install dependencies (e.g., `pip install playwright`), project file structure, and run commands.

#### Module 5: Release Summary Report (Релизный отчет)
- Summarizes project execution stats: Total Tests, Passed %, Open Bugs (by Severity), and a "Go/No-Go" release readiness verdict based on risk matrix.

#### Module 6: QA Utilities (Генератор данных)
- Instant client-side generation and copy for: Boundary strings, special symbols/SQLi payloads, invalid emails, XSS strings, and random dates.

---

### 4. DATA EXPORT & IMPORT
- Copy to Clipboard buttons for all Markdown, Jira, and Code blocks.
- Export options: Markdown (`.md`), CSV, PDF, and `.py`/`.js` code files.
- Backup & Restore: Full JSON import/export of `localStorage` data to move projects between computers.

---

### 5. SYSTEM PROMPT INSTRUCTIONS FOR AI ENGINE
Ensure all system prompts sent to LLMs enforce QA best practices as of 2026:
- Adhere strictly to ISTQB CTFL v4.0 methodology.
- Apply ISO 25010 for quality attributes.
- Use explicit action verbs in test steps ("Click", "Enter", "Select").
- Provide clear, unambiguous Expected Results.

Build this application completely with interactive components, mock state management, syntax highlighting for code blocks, and crisp UI typography.