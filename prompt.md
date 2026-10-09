# MIA — AI-Assisted Development Log

This document records the project state and significant AI-assisted work captured in the development conversation. It distinguishes verified checks from work that was not tested. Earlier coding turns did not retain their exact model identifiers; those are marked unknown rather than guessed. No credentials or secrets are included.

## 1. Project Overview

### Problem

People can miss useful context, direct mentions, action items, decisions, and deadlines in busy WhatsApp conversations.

### Solution

MIA is a privacy-first Chrome extension that reads messages currently loaded in the active WhatsApp Web conversation and asks a locally running language model for a structured catch-up.

### Target users

People who want to catch up on an active WhatsApp conversation, especially group chats, without sending their messages to a cloud AI service.

### Current features

- Popup modes for a general summary, mentions, tasks, and deadlines.
- Extraction of currently loaded WhatsApp messages in the content script.
- Local analysis through a FastAPI service and Ollama.
- An in-page results panel.
- Downloadable `.ics` calendar reminders for reported deadlines.

### Known limitations

- WhatsApp Web's DOM is not a stable public API; extraction can break when the page changes.
- Only currently loaded messages are analyzed.
- The response-quality evaluation is a tiny synthetic pilot and is not representative accuracy evidence.

## 2. Tech Stack & Architecture

- **Browser:** Google Chrome, Manifest V3 extension.
- **Extension UI:** HTML, CSS, and JavaScript.
- **Backend:** Python, FastAPI, Pydantic, HTTPX, and Uvicorn.
- **Local model runtime:** Ollama with `qwen2.5:3b`.
- **Request flow:** Popup → content script extracts messages → background service worker calls `http://127.0.0.1:8000/analyze` → FastAPI sends a prompt to Ollama on `127.0.0.1:11434` → structured result returns to the content script.
- **Calendar:** The content script creates a local `.ics` file; calendar synchronization is not implemented.
- **Data handling:** The intended architecture keeps model inference on the user's machine and does not persist chat messages in the backend.

## 3. AI Code Generation

The coding assistant was **Copilot SDK in VS Code**. Exact model IDs for earlier coding turns were not retained in the conversation, so they are not attributed here. The local model used for the recorded quality evaluation was `qwen2.5:3b`.

| Actual user prompt / instruction | Tool/model | Purpose | Files/components affected | Outcome and verification |
|---|---|---|---|---|
| “fix the syntax” | Copilot SDK in VS Code; exact model not retained | Repair the content script's IIFE ending. | `extension/content.js` | Replaced the mismatched ending with `})();`. No syntax-check result was recorded for that specific turn. |
| “chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => { … if (msg.type !== "MIA_ANALYZE") return; add this content” | Copilot SDK in VS Code; exact model not retained | Connect popup messages to extraction, local analysis, and the result overlay. | `extension/content.js` | Listener added and script passed `node --check`. |
| “instead of body.querySelectorAll("[data-ics]").forEach(btn => … JSON.parse(btn.dataset.ics))” use indexed `state.reminders` lookup | Copilot SDK in VS Code; exact model not retained | Associate reminder buttons with in-memory deadline objects. | `extension/content.js` | Reminder state and indexed click handler added; syntax check passed. |
| “Step 3 — Remove JSON from the HTML … replace it with … `data-ics="1"`” | Copilot SDK in VS Code; exact model not retained | Stop serializing deadline objects into button attributes. | `extension/content.js` | Markup updated; syntax check passed. |
| Shared console error: “No WhatsApp messages found in the current chat.” | Copilot SDK in VS Code; exact model not retained | Investigate message extraction returning no results. | `extension/content.js` | Added selector fallbacks for message containers, `.message-in`/`.message-out`, and timestamped `.copyable-text`; script syntax check passed. The selectors were not verified against a captured live WhatsApp DOM fixture. |
| Shared CORS/HTTP 500 errors and “i need to put the remainders on calender” | Copilot SDK in VS Code; exact model not retained | Move API requests out of the WhatsApp page context and clarify calendar reminders. | `extension/background.js`, `extension/manifest.json`, `extension/content.js`, `README.md` | Added a Manifest V3 service worker for local API calls and surfaced backend HTTP error details. JavaScript and manifest JSON checks passed; a full live extension-to-backend round trip was not recorded. |
| “add the ui of this extension more mordern and then well export this to github” | Copilot SDK in VS Code; exact model not retained | Refresh the popup and in-page overlay UI. | `extension/popup.html`, `extension/popup.css`, `extension/content.css`, `.gitignore` | Updated styling and popup layout. The popup was previewed in a browser. No files were pushed to an unrelated Git remote. |
| “- Hosted web demo (simplest): deploy a page where judges paste sample chat text, then show MIA’s summary and reminders. No extension installation required. lets do this” | Copilot SDK in VS Code; exact model not retained | Create a static, browser-only hackathon demo. | `demo/index.html`, `demo/style.css`, `demo/app.js`, `.github/workflows/pages.yml`, `README.md` | Built and previewed the sample flow; checked that generated ICS data contained the sample event date/time. The user later requested deleting all website files; the demo and Pages workflow were removed. They are not part of the current product. |
| “ok now improvise the chat response implement a quick metrics accuracy analysi very quick and update that in readme.md” | Copilot SDK in VS Code; exact model not retained | Begin improving responses and evaluate quality. | `README.md` was later updated; backend implementation was not changed during this request. | Python environment setup was interrupted. A later instruction narrowed the request to documenting only the metrics obtained. |
| “leave it whatever metrics you have texted only those you add and modify readme” | Copilot SDK in VS Code; exact model not retained | Limit the prior request to documenting already measured metrics, not adding an unverified code change. | `README.md` | Documented that precision, recall, and F1 had not yet been measured at that moment; subsequent user request asked to perform the evaluation. |
| “evaluated precision recall and f1” | Copilot SDK in VS Code; exact model not retained; runtime model `qwen2.5:3b` | Run a quick labeled response-quality evaluation. | Local `/analyze` API; results in `README.md` | Five fictional chats produced 25 binary category-presence decisions. Baseline micro P/R/F1 was 62.5% / 90.9% / 74.1%. |
| “MASTER PROMPT — VIBE CODING HACKATHON … Before generating any application code, create a file named prompt.md in the root of my GitHub repository … Do not invent prompts, results, or testing outcomes … Now understand my project idea, prepare the development plan, and generate the initial prompt.md.” | Copilot SDK in VS Code; current turn model GPT-6 Luna | Document the actual project, architecture, significant AI interactions, debugging, testing, and planned next steps before further coding. | `prompt.md` | Created this development log from observed project files and conversation history; unavailable historical model identifiers are marked unknown. |
| “Yes, proceed with the plan” | Copilot SDK in VS Code; current turn model GPT-6 Luna | Authorize the proposed backend prompt review, labeled repeatable evaluation, focused prompt refinement, and verification. | `backend/main.py`, `backend/evaluation_cases.json`, `backend/evaluate.py`, `backend/test_evaluate.py`, `README.md`, `prompt.md` | Started the confirmed work; the prompt change and harness were implemented and evaluated. |
| “COMPLETE PROMPT.MD” | Copilot SDK in VS Code; current turn model GPT-6 Luna | Complete the AI-assisted development log with the work and measurements completed so far. | `prompt.md`, `README.md` | This update records the harness, prompt experiment, test results, both evaluation runs, and the interrupted repeat attempt without claiming further results. |
| “push to github repo link https://github.com/tanisha-kiran/MIA-whatsapp-summarizer” | Copilot SDK in VS Code; exact model not retained | Publish the MIA extension project. | MIA repository Git history | Pushed the extension, backend, README, and `.gitignore` to the dedicated repository. The local virtual environment was excluded. |
| “tanisha kiran solely” | Copilot SDK in VS Code; exact model not retained | Set the published commit's author/committer and remove its co-author trailer. | MIA repository Git history | Rewrote and force-pushed the single commit as Tanisha Kiran. GitHub's later contributor API reported only `tanisha-kiran`. |

## 4. Debugging

### Verbatim hackathon workflow prompt

The user supplied the following instruction before this session's implementation work:

> MASTER PROMPT — VIBE CODING HACKATHON
>
> Act as my AI coding partner, software architect, and debugging assistant. Help me turn my project idea into a functional, innovative, and demonstrable product during this hackathon.
>
> **Phase 1: Understand & Plan**
>
> First, understand my project idea, problem statement, target users, core features, preferred tech stack, and constraints.
>
> Help me define the MVP, choose a suitable architecture, and create a practical development plan. Ask questions only when necessary.
>
> **Phase 2: Generate prompt.md**
>
> Before generating any application code, create a file named prompt.md in the root of my GitHub repository.
>
> The file must document my AI-assisted development process and include:
>
> 1. Project Overview: Problem, solution, and key features.
> 2. Tech Stack & Architecture: Technologies and system design.
> 3. AI Code Generation: Significant prompts used to generate or modify code.
> 4. Debugging: Important errors, prompts used, and solutions.
> 5. AI Features & Design: Prompts used for AI integrations, architecture, and UI/UX decisions.
> 6. Testing & Improvements: Important testing, optimization, and debugging activities.
> 7. Final Summary: AI tools used, major contributions, and completed features.
>
> For each significant AI interaction, record:
>
> - Actual prompt or instruction
> - AI tool/model used
> - Purpose of the interaction
> - Files or components affected
> - Outcome and verification status
>
> Do not invent prompts, results, or testing outcomes. Never include API keys, passwords, or other secrets.
>
> **Phase 3: Start Vibe Coding**
>
> After presenting the initial prompt.md and development plan, wait for my confirmation before generating application code.
>
> Help me build the project step by step, generate code, fix errors, and test features. Keep prompt.md updated throughout development with significant AI-assisted interactions.
>
> Important: The prompt.md file must accurately reflect the actual development process. Create it before coding begins and maintain it throughout the hackathon.
>
> Now understand my project idea, prepare the development plan, and generate the initial prompt.md. Let’s build something amazing!

### Extension syntax

- **Prompt:** “fix the syntax”
- **Issue:** The content script's immediately invoked function had a mismatched closing sequence.
- **Resolution:** Closed it with `})();`.
- **Verification:** No direct parser output was retained for that initial fix; later content-script edits passed `node --check`.

### Empty message extraction

- **Observed error:** `No WhatsApp messages found in the current chat.`
- **Resolution:** Expanded `getMessages()` to try multiple WhatsApp DOM selectors and determine outgoing messages using `.message-out`.
- **Verification:** JavaScript syntax passed. Because WhatsApp's DOM changes and no live DOM snapshot was retained, extraction reliability remains unverified across real chats.

### CORS / local service request

- **Observed browser error:** A request from `https://web.whatsapp.com` to the local FastAPI service was blocked by CORS; the console also showed HTTP 500.
- **Resolution:** Routed the request through the extension's background service worker and included response details in reported errors.
- **Verification:** JavaScript syntax and `manifest.json` parsing passed. No end-to-end re-test of that exact extension request was recorded; the error's underlying backend cause was not established.

### Response-quality prompt experiment

- **User request:** “ok now improvise the chat response implement a quick metrics accuracy analysi very quick and update that in readme.md”
- **Follow-up scope:** “leave it whatever metrics you have texted only those you add and modify readme”, then “evaluated precision recall and f1”.
- **First measurement:** Five manually labeled fictional chat cases were sent to the live local `/analyze` API. Baseline micro precision/recall/F1 was 62.5% / 90.9% / 74.1%.
- **Confirmed follow-up:** The user supplied the Vibe Coding Hackathon master prompt and confirmed the development plan with “Yes, proceed with the plan”.
- **Implementation:** Added a JSON case fixture, an Ollama-backed evaluation runner, metric calculation tests, and prompt rules for task ownership, mention names, explicit decisions, important updates, and explicit date/time evidence.
- **Verification:** Four metric unit tests passed. Pylance syntax checks found no syntax errors in the new Python files. One run of `evaluate.py` against the local `qwen2.5:3b` produced updated micro precision/recall/F1 of 85.7% / 54.5% / 66.7%.
- **Result interpretation:** Precision rose, but recall and micro F1 fell relative to baseline; the change is not a demonstrated overall quality improvement. The sample is too small and model output can vary.
- **Interrupted follow-up:** A second evaluation was started after adding mismatch reporting, but execution was interrupted. It produced no verified second-run metrics; none are reported.

### GitHub publication

- **Issue:** The first configured project root belonged to an unrelated repository.
- **Resolution:** Initialized a separate Git repository inside the MIA project folder and pushed only MIA files to its dedicated repository. A later push to a different owner's repository was denied with HTTP 403 due to account permissions.
- **Verification:** The MIA `main` branch was confirmed synchronized with `tanisha-kiran/MIA-whatsapp-summarizer`; only the requested account appeared in the contributor API result.

## 5. AI Features & Design

- The existing backend prompt instructs the local model to return JSON containing a summary, important messages, mentions, tasks, decisions, and deadlines.
- The backend prompt emphasizes using only the supplied transcript and not inventing facts or dates.
- The user-facing design keeps analysis local through Ollama and uses an `.ics` download instead of a cloud calendar integration.
- The static web demo was created as a temporary exploration, then removed at the user's request. The current project remains the Chrome extension and local backend.
- The locally evaluated model was `qwen2.5:3b`; no hosted AI integration is implemented.
- The backend prompt was refined to emphasize that tasks must be user-owned, mentions must refer to the configured user, decisions must be explicit, “important” should not be a catch-all, and deadlines require an explicit date and time.
- The prompt refinement is an experiment, not a proven quality improvement; the measured micro F1 decreased in its single recorded post-change run.

## 6. Testing & Improvements

### Recorded checks

- `node --check` passed for extension JavaScript after the listener, reminder, and local-request changes.
- The extension manifest parsed as valid JSON.
- The popup layout was previewed in the integrated browser.
- During the temporary demo work, a browser preview exercised sample analysis and inspected the generated calendar event data. The demo was subsequently removed.
- The local MIA health endpoint and Ollama model tags endpoint responded during the metrics evaluation.
- Four `unittest` checks for precision/recall/F1 calculation, zero denominators, case-count mismatch, and micro aggregation passed.
- Pylance reported no syntax errors in `backend/evaluate.py` or `backend/test_evaluate.py`.
- Pylance also reported a pre-existing unused `re` import in `backend/main.py`; it was not changed as part of this task.

### Baseline and refined-prompt pilot metrics

Both runs used the local `qwen2.5:3b` backend and the same five manually labeled fictional chats: 25 binary decisions about whether each category was present. A category prediction counted as positive if the model returned at least one item for that category. The baseline run was sent inline to the local API; the later run used the new `backend/evaluate.py` harness and `backend/evaluation_cases.json`.

| Category | Baseline P / R / F1 | Refined-prompt P / R / F1 |
|---|---:|---:|---:|
| Mentions | 80.0% / 100.0% / 88.9% | 100.0% / 25.0% / 40.0% |
| Tasks | 66.7% / 100.0% / 80.0% | 100.0% / 100.0% / 100.0% |
| Important messages | 33.3% / 100.0% / 50.0% | 0.0% / 0.0% / 0.0% |
| Decisions | 33.3% / 50.0% / 40.0% | 100.0% / 50.0% / 66.7% |
| Deadlines | 100.0% / 100.0% / 100.0% | 100.0% / 100.0% / 100.0% |
| **Micro overall** | **62.5% / 90.9% / 74.1%** | **85.7% / 54.5% / 66.7%** |

These are category-presence scores, not item-level extraction accuracy. The sample is small and synthetic; the perfect deadline score is based on only two positive cases. Model output varied between the baseline and refined-prompt runs; the one recorded refined-prompt run had lower micro recall and F1. A further evaluation attempt was interrupted and has no result. Do not present these pilot numbers as representative accuracy.

### Confirmed plan status

1. Review API schema, prompt, and current UI while preserving local-only processing — **inspected**; full extension round-trip validation remains pending.
2. Add a repeatable labeled evaluation fixture and tests that do not require live Ollama — **implemented**; four metric unit tests pass. The model evaluation runner itself requires Ollama.
3. Use pilot errors to refine the prompt — **attempted**; measured once, with lower overall F1, so the refinement is not accepted as a proven improvement.
4. Test task ownership, date/time parsing, invalid model responses, and calendar export — **not completed** as a focused regression suite.
5. Exercise the Chrome popup → content script → background worker → backend flow — **not completed** end to end.
6. Re-run evaluation and update metrics — **one post-change run completed**; a follow-up run was interrupted. The README records baseline and post-change results and their limitations.

## 7. Final Summary

### Current implemented state

- Manifest V3 Chrome extension with modern popup and in-page catch-up panel.
- WhatsApp message extraction with multiple DOM selector fallbacks.
- Local FastAPI → Ollama analysis flow through an extension background worker.
- In-memory reminder mapping and local `.ics` calendar file generation.
- `backend/evaluation_cases.json`, `backend/evaluate.py`, and `backend/test_evaluate.py` provide a small labeled pilot fixture, a live-model evaluation runner, and metric-calculation tests.
- README setup/privacy guidance and baseline/refined-prompt precision, recall, and F1 pilot results with limitations.
- `prompt.md` records the known AI-assisted project history; exact model identifiers not preserved from earlier turns are explicitly unknown.

### AI tools and contributions

- **Coding assistant:** Copilot SDK in VS Code. Exact model IDs for earlier coding turns were not retained; the current documentation and implementation turns use GPT-6 Luna.
- **Local analysis model:** Ollama `qwen2.5:3b`.
- **Human role:** The user supplied feature requests, directed the scope back to the Chrome extension after the temporary web-demo experiment, reviewed project outcomes, and specified repository publication/account attribution.
- **Assistant role:** Implemented requested extension/backend/documentation changes, checked syntax and browser behavior where recorded, ran the pilot evaluation, and maintained this interaction log.
