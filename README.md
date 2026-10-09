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

Click **Add reminder** on a deadline to download an `.ics` calendar file. Open or import that file in your calendar app to add the event.

## Privacy

- AI processing uses Ollama locally; no cloud AI API is used.
- The backend does not log or store conversation messages.
- The extension stores the name and selected mode in Chrome local storage.
- The extension communicates with `127.0.0.1` only.
- Calendar reminders are generated locally as `.ics` files; there is no calendar API or cloud sync.

## Prototype limitation

WhatsApp Web's DOM is not a stable public API. MIA reads messages currently loaded in the active chat, so it may need updates when WhatsApp changes its page structure.

## Response quality metrics

Quick pilot evaluation of the local `qwen2.5:3b` backend against **5 manually labeled fictional chats** (25 binary category-presence decisions across mentions, tasks, important messages, decisions, and deadlines):

| Category | Precision | Recall | F1 |
|---|---:|---:|---:|
| Mentions | 80.0% | 100.0% | 88.9% |
| Tasks | 66.7% | 100.0% | 80.0% |
| Important messages | 33.3% | 100.0% | 50.0% |
| Decisions | 33.3% | 50.0% | 40.0% |
| Deadlines | 100.0% | 100.0% | 100.0% |
| **Micro overall** | **62.5%** | **90.9%** | **74.1%** |

For each chat and category, a prediction counted as positive when the model returned one or more items; scores measure category presence, **not** whether individual extracted items were fully correct. This is a tiny, synthetic smoke-test set, not a representative WhatsApp benchmark. The perfect deadline score reflects only two positive examples. Treat all results as preliminary; a larger, diverse, independently labeled test set is needed before making accuracy claims.
