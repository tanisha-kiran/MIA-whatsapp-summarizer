# MIA — Local WhatsApp Catch-Up

A privacy-first Chrome extension for catching up on the currently loaded WhatsApp Web conversation. The extension sends messages only to the local MIA backend, which uses Ollama on your computer.

## Requirements

- Google Chrome
- [Ollama](https://ollama.com/) with the `qwen2.5:3b` model
- Python 3.10 or newer

## Setup

### 1. Install and start Ollama

    ollama pull qwen2.5:3b

### 2. Start the local backend

Windows:

    cd backend
    py -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --host 127.0.0.1 --port 8000

Check that the service is running at `http://127.0.0.1:8000/health`.

### 3. Load the extension

In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select this project's `extension/` folder.

### 4. Analyze a conversation

Open WhatsApp Web and the conversation you want to review. Load the messages you want MIA to analyze, click the MIA extension, enter your name, choose a catch-up mode, and select **Analyze current chat**.

Click **Add reminder** on a detected deadline, or **Add a reminder** to create one manually, to download an `.ics` calendar file. Open or import that file in your calendar app to add the event.

## Privacy

- AI processing uses Ollama locally; no cloud AI API is used.
- The backend does not log or store conversation messages.
- The extension stores the name and selected mode in Chrome local storage.
- The extension communicates with `127.0.0.1` only.
- Calendar reminders are generated locally as `.ics` files; there is no calendar API or cloud sync.

## Prototype limitation

WhatsApp Web's DOM is not a stable public API. MIA reads messages currently loaded in the active chat, so it may need updates when WhatsApp changes its page structure.

## Response quality metrics

### Evaluation method

Run `python evaluate.py` from the `backend/` directory while Ollama is running. The harness submits five manually labeled fictional chats (25 binary category-presence decisions) to the configured local model and reports precision, recall, F1, and confusion counts by category. A prediction counts as positive when the model returns at least one item in that category. The data is in `backend/evaluation_cases.json`.

### Pilot results

| Category | Initial prompt P / R / F1 | Refined prompt P / R / F1 |
|---|---:|---:|
| Mentions | 80.0% / 100.0% / 88.9% | 100.0% / 25.0% / 40.0% |
| Tasks | 66.7% / 100.0% / 80.0% | 100.0% / 100.0% / 100.0% |
| Important messages | 33.3% / 100.0% / 50.0% | 0.0% / 0.0% / 0.0% |
| Decisions | 33.3% / 50.0% / 40.0% | 100.0% / 50.0% / 66.7% |
| Deadlines | 100.0% / 100.0% / 100.0% | 100.0% / 100.0% / 100.0% |
| **Micro overall** | **62.5% / 90.9% / 74.1%** | **85.7% / 54.5% / 66.7%** |

Each cell lists **precision / recall / F1**. The second run used more specific instructions about user ownership, explicit decisions, important updates, and dates. It raised overall precision but lowered recall and micro F1 on this pilot; the prompt change is **not a demonstrated overall improvement**.

These category-presence scores do not measure whether each returned item is factually correct. This is a tiny synthetic smoke test, not a representative WhatsApp benchmark. The perfect deadline result covers only two positive cases, and model output can vary between runs. Use a larger, diverse, independently labeled dataset before making accuracy claims.
