import { ReplitConnectors } from "@replit/connectors-sdk";

export type SupabaseResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
};

export async function supabaseRequest<T>(
  path: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
): Promise<SupabaseResponse<T>> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("supabase", path, init);
  const text = await response.text();
  let data: T;
  try {
    data = text ? (JSON.parse(text) as T) : (undefined as T);
  } catch {
    data = text as T;
  }

  return { ok: response.ok, status: response.status, data };
}

export async function supabaseAuthRequest<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<SupabaseResponse<T>> {
  return supabaseRequest<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}