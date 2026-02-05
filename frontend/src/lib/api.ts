const rawBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const apiBaseUrl = rawBase.endsWith("/") && rawBase !== "/" ? rawBase.slice(0, -1) : rawBase;

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(buildUrl(path));
  if (!res.ok) {
    throw await buildError(res);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(buildUrl(path), {
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





