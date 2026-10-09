const nameInput = document.getElementById("name");
const status = document.getElementById("status");
let mode = "summary";

chrome.storage.local.get(["name", "mode"], data => {
  if (data.name) nameInput.value = data.name;
  if (data.mode) {
    mode = data.mode;
    document.querySelector(`[data-mode="${mode}"]`)?.classList.add("selected");
  } else {
    document.querySelector('[data-mode="summary"]').classList.add("selected");
  }
});

document.querySelectorAll("[data-mode]").forEach(btn => {
  btn.addEventListener("click", () => {
    mode = btn.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    chrome.storage.local.set({ mode });
  });
});

nameInput.addEventListener("input", () => chrome.storage.local.set({ name: nameInput.value.trim() }));

async function sendAnalysis(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    const messageText = error.message || String(error);
    if (
      !messageText.includes("Receiving end does not exist") &&
      !messageText.includes("Could not establish connection")
    ) {
      throw error;
    }
  }

  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ["content.css"]
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
  return chrome.tabs.sendMessage(tabId, message);
}

document.getElementById("analyze").addEventListener("click", async () => {
  const name = nameInput.value.trim();
  if (!name) {
    status.textContent = "Add your name first.";
    return;
  }

  status.textContent = "Reading the current WhatsApp chat…";

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.url?.startsWith("https://web.whatsapp.com/")) {
      status.textContent = "Open WhatsApp Web first.";
      return;
    }
    if (tab.id === undefined) {
      throw new Error("Could not identify the active WhatsApp tab.");
    }

    const response = await sendAnalysis(tab.id, {
      type: "MIA_ANALYZE",
      name,
      mode
    });

    status.textContent = response?.ok
      ? "Done — MIA opened the result in WhatsApp Web."
      : (response?.error || "Could not analyze this chat.");

  } catch (e) {
    status.textContent = `Connection error: ${e.message || String(e)}`;
    console.error("MIA connection error:", e);
  }
});
