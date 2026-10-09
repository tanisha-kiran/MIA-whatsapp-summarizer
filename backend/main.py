from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx, json, re

app = FastAPI(title="MIA Local Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL = "qwen2.5:3b"

class Message(BaseModel):
    text: str
    outgoing: bool = False

class AnalyzeRequest(BaseModel):
    name: str
    mode: str = "summary"
    messages: list[Message]

def build_prompt(req: AnalyzeRequest):
    transcript = "\n".join(
        f"{i+1}. {'[YOU] ' if m.outgoing else ''}{m.text}"
        for i, m in enumerate(req.messages)
    )

    focus = {
        "summary": "Give a useful general catch-up, but prioritize things the user needs to know.",
        "mentions": "Focus especially on messages that mention the user's name or clearly address the user. Also report important context around those mentions.",
        "tasks": "Focus on tasks assigned to the user, requests, responsibilities, and follow-ups.",
        "deadlines": "Focus on deadlines, dates, meetings, events, and anything that should become a reminder."
    }.get(req.mode, "Give a useful general catch-up.")

    return f"""
You are MIA, a privacy-first WhatsApp catch-up assistant.
The user's name is: {req.name}

{focus}

Analyze ONLY the supplied WhatsApp messages. Do not invent facts.
Ignore greetings, jokes, repetitive chatter, and low-value conversation.

Return ONLY valid JSON with this exact structure:
{{
  "summary": "2-4 concise sentences",
  "important": ["..."],
  "mentions": ["..."],
  "tasks": ["..."],
  "decisions": ["..."],
  "deadlines": [
    {{"title":"...", "text":"...", "date_time":"YYYY-MM-DDTHH:MM:SS"}}
  ]
}}

Rules:
- Put a message in mentions if the user's name appears or the message clearly addresses the user.
- Only put genuine user tasks in tasks.
- Only create a deadline when the message provides enough information to infer a date/time. If there is no exact date/time, do not fabricate one.
- Use ISO local time without timezone for date_time.
- Keep each item short.
- If a category has nothing, return [].

Messages:
{transcript}
"""

@app.get("/health")
async def health():
    return {"ok": True, "local": True, "model": MODEL}

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    prompt = build_prompt(req)
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.1}
    }

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        data = response.json()

    raw = data["message"]["content"]
    result = json.loads(raw)
    result["message_count"] = len(req.messages)
    return result
