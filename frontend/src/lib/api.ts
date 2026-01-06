export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`);
  if (!res.ok) {
    throw await buildError(res);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return (await res.json()) as T;
}

async function buildError(res: Response): Promise<Error> {
  try {
    const json = (await res.json()) as { message?: string };
    return new Error(json.message ?? `요청 실패 (${res.status})`);
  } catch {
    return new Error(`요청 실패 (${res.status})`);
  }
}



