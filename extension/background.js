chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "MIA_API_ANALYZE") return;

  (async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: msg.name,
          mode: msg.mode,
          messages: msg.messages
        })
      });
      const responseText = await response.text();
      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          `MIA service returned HTTP ${response.status}: ${responseText || response.statusText}`
        );
      }

      if (!response.ok) {
        const detail = result.detail || result.error || response.statusText;
        throw new Error(`MIA service returned HTTP ${response.status}: ${detail}`);
      }

      sendResponse({ ok: true, result });
    } catch (error) {
      console.error("MIA API request failed:", error);
      sendResponse({
        ok: false,
        error: error.message || "Could not connect to the local MIA service."
      });
    }
  })();

  return true;
});
