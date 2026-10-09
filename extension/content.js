(() => {
  console.log("MIA content script loaded", location.href);
  const state = { overlay: null, reminders: [] };

  function clean(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function getMessages() {
    const selectors = [
      '[data-testid="msg-container"]',
      ".message-in, .message-out",
      ".copyable-text[data-pre-plain-text]"
    ];

    for (const selector of selectors) {
      const unique = [];
      const seen = new Set();

      for (const node of document.querySelectorAll(selector)) {
        const text = clean(node.innerText);
        if (!text || text.length < 2 || seen.has(text)) continue;
        seen.add(text);
        unique.push({
          text,
          outgoing: node.matches(".message-out") || !!node.closest(".message-out")
        });
      }

      if (unique.length) return unique.slice(-150);
    }

    return [];
  }

  function showResult(result) {
    state.overlay?.remove();

    const box = document.createElement("div");
    box.id = "mia-overlay";
    box.innerHTML = `
      <div class="mia-card">
        <div class="mia-head">
          <div><strong>MIA</strong><span>LOCAL CATCH-UP</span></div>
          <button id="mia-close">×</button>
        </div>
        <div class="mia-body"></div>
      </div>`;
    document.body.appendChild(box);
    state.overlay = box;

    box.querySelector("#mia-close").onclick = () => box.remove();

    const body = box.querySelector(".mia-body");
    body.innerHTML = renderResult(result);
    state.reminders = result.deadlines || [];

    body.querySelectorAll("[data-ics]").forEach((btn, index) => {
      btn.onclick = () => {
        const item = state.reminders[index];
        if (item) downloadICS(item);
      };
    });
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function section(title, items, cls="") {
    if (!items?.length) return "";
    return `<section class="${cls}"><h3>${esc(title)}</h3>` +
      items.map(x => `<div class="mia-item">${esc(typeof x === "string" ? x : x.text || x.title || JSON.stringify(x))}</div>`).join("") +
      `</section>`;
  }

  function renderResult(r) {
    const mention = r.mentions || [];
    const tasks = r.tasks || [];
    const deadlines = r.deadlines || [];
    return `
      ${r.message_count ? `<div class="mia-count">${r.message_count} messages analyzed</div>` : ""}
      ${section("🔴 Important", r.important)}
      ${section("👤 You were mentioned", mention, "mention")}
      ${section("✓ Your tasks", tasks, "task")}
      ${section("📌 Decisions", r.decisions)}
      ${section("⏰ Deadlines", deadlines, "deadline")}
      ${r.summary ? `<section><h3>Summary</h3><div class="mia-summary">${esc(r.summary)}</div></section>` : ""}
      ${deadlines.map(d =>
        `<button class="mia-reminder" data-ics="1">Add reminder: ${esc(d.title || d.text || "deadline")}</button>`
      ).join("")}
      <div class="mia-foot">Processed locally • No cloud AI</div>
    `;
  }


function downloadICS(item) {
  const rawDate = item?.date_time;

  let start;
  if (rawDate) {
    start = new Date(rawDate);
  } else {
    const date = prompt(
      `What date is "${item.title || item.text || "this deadline"}" on?\nEnter YYYY-MM-DD:`
    );

    if (!date) return;

    const timeMatch = (item.text || item.title || "").match(
      /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i
    );

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !timeMatch) {
      alert("I couldn't determine the date or time. Please check the deadline in the chat.");
      return;
    }

    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2] || 0);
    const meridiem = timeMatch[3].toLowerCase();

    if (hour < 1 || hour > 12 || minute > 59) {
      alert("That deadline time looks invalid.");
      return;
    }

    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;

    start = new Date(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
      hour,
      minute
    );

    if (
      start.getFullYear() !== Number(date.slice(0, 4)) ||
      start.getMonth() !== Number(date.slice(5, 7)) - 1 ||
      start.getDate() !== Number(date.slice(8, 10))
    ) {
      alert("That date isn't valid. Please try again.");
      return;
    }
  }

  if (!start || Number.isNaN(start.getTime())) {
    alert("This deadline has an invalid date/time.");
    return;
  }

  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const fmt = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const escapeICS = value =>
    String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MIA//Local Catch-Up//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:mia-${Date.now()}@local`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeICS(item.title || "WhatsApp deadline")}`,
    `DESCRIPTION:${escapeICS(item.text || "")}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n") + "\r\n";

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mia-reminder.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("MIA received message:", msg.type);

  if (msg.type !== "MIA_ANALYZE") return;

  (async () => {
    try {
      const messages = getMessages();
      if (!messages.length) {
        throw new Error("No WhatsApp messages found in the current chat.");
      }

      const analysis = await chrome.runtime.sendMessage({
        type: "MIA_API_ANALYZE",
        name: msg.name,
        mode: msg.mode,
        messages
      });

      if (!analysis?.ok) {
        throw new Error(analysis?.error || "Could not analyze this chat.");
      }

      showResult(analysis.result);
      sendResponse({ ok: true });
    } catch (error) {
      console.error("MIA analysis failed:", error);
      sendResponse({
        ok: false,
        error: error.message || "Could not analyze this chat."
      });
    }
  })();

  return true;
});
})();