import { Status, TransportRequest } from "./types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "No se pudo completar la operacion.");
  }

  return response.json();
}

export function listRequests(status: "all" | Status) {
  return requestJson<TransportRequest[]>(`/requests${status === "all" ? "" : `?status=${status}`}`);
}

export function processRequest(sourceText: string) {
  return requestJson<TransportRequest>("/requests/process", {
    method: "POST",
    body: JSON.stringify({ source_text: sourceText }),
  });
}

export function updateRequest(id: number, changes: Record<string, string | number | null>) {
  return requestJson<TransportRequest>(`/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}
