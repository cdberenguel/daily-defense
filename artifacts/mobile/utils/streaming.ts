import { fetch } from "expo/fetch";

export async function streamFromEndpoint(
  url: string,
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    let completed = false;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const handleLine = (line: string) => {
      if (!line.startsWith("data: ")) return;
      const data = JSON.parse(line.slice(6));
      if (data.error) throw new Error(String(data.error));
      if (data.content) onChunk(data.content);
      if (data.done && !completed) {
        completed = true;
        onDone();
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        handleLine(line);
      }
    }

    if (buffer.trim()) handleLine(buffer.trim());
    if (!completed) throw new Error("The response ended before the stream completed.");
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

export function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}
