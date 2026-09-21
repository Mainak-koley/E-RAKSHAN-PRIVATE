// Thin client for a locally-running Ollama server (https://ollama.com).
// Used ONLY as a fallback for general-knowledge / open-ended questions that
// SAHAY's deterministic command engine (commandEngine.js) can't match.
// Everything else in SAHAY (navigation, recommendations, priority queue,
// approvals) stays fully rule-based - we never let the LLM trigger actions.

const OLLAMA_URL = (import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434').replace(/\/+$/, '');
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2';
export const OLLAMA_ENABLED = (import.meta.env.VITE_OLLAMA_ENABLED ?? 'true') !== 'false';

const SYSTEM_PROMPT = `You are SAHAY, a calm, concise voice assistant embedded in a disaster-response
dashboard (E-Rakshan) used by field officers. Answer general questions helpfully in 1-4 short
sentences suitable for being read aloud. You are NOT the app's command router - for anything about
navigating pages, priorities, shelters, routes, or approvals, tell the user to ask SAHAY directly
(e.g. "try asking: which location needs rescue first"). Never invent operational data (casualty
numbers, shelter capacity, coordinates) - only the app's own data sources are authoritative for that.`;

/**
 * Quick reachability check - lets the UI show a clear message instead of a
 * generic network error if Ollama isn't running.
 */
export async function pingOllama() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Sends a chat request to Ollama and streams the reply.
 * @param {string} prompt - the user's question
 * @param {object} [opts]
 * @param {(partialText: string) => void} [opts.onToken] - called with the growing response as tokens arrive
 * @param {AbortSignal} [opts.signal] - to cancel an in-flight request
 * @returns {Promise<string>} the full response text
 */
export async function askOllama(prompt, { onToken, signal } = {}) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Model "${OLLAMA_MODEL}" was not found. Run: ollama pull ${OLLAMA_MODEL}`);
    }
    throw new Error(`Ollama request failed (${res.status}).`);
  }

  // Ollama streams newline-delimited JSON objects, not SSE.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      let json;
      try { json = JSON.parse(line); } catch { continue; }
      const piece = json.message?.content;
      if (piece) {
        full += piece;
        onToken?.(full);
      }
      if (json.done) return full;
    }
  }
  return full;
}
