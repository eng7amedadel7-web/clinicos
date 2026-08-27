import { ReplitConnectors } from "@replit/connectors-sdk";

export type SupabaseResponse<T> = {
  ok: boolean;
  status: number;
  data: T;
};

type RequestInitLike = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export function getSupabasePublicConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY)?.trim();
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

function directSupabaseConfig() {
  return getSupabasePublicConfig();
}

async function parseResponse<T>(response: Response): Promise<SupabaseResponse<T>> {
  const text = await response.text();
  let data: T;
  try {
    data = text ? (JSON.parse(text) as T) : (undefined as T);
  } catch {
    data = text as T;
  }
  return { ok: response.ok, status: response.status, data };
}

async function directRequest<T>(
  baseUrl: string,
  publishableKey: string,
  path: string,
  init: RequestInitLike,
): Promise<SupabaseResponse<T>> {
  const url = path.startsWith("http://") || path.startsWith("https://")
    ? path
    : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      apikey: publishableKey,
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
    body: init.body,
  });
  return parseResponse<T>(response);
}

export async function supabaseRequest<T>(
  path: string,
  init: RequestInitLike = {},
): Promise<SupabaseResponse<T>> {
  try {
    const direct = directSupabaseConfig();
    if (direct) {
      return await directRequest<T>(direct.url, direct.key, path, init);
    }

    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("supabase", path, init);
    return await parseResponse<T>(response);
  } catch (error) {
    console.error("[Supabase] Request failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { ok: false, status: 503, data: undefined as T };
  }
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

export async function supabaseAdminRequest<T>(
  path: string,
  init: RequestInitLike = {},
): Promise<SupabaseResponse<T>> {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url || !key) {
    return { ok: false, status: 503, data: undefined as T };
  }
  return directRequest<T>(url, key, path, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init.headers ?? {}),
    },
  });
}
