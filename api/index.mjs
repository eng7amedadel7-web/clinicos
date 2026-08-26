import app from "../artifacts/api-server/dist/vercel.mjs";

function getForwardedPath(req) {
  const query = req.query ?? {};
  const value = query.__meruna_path;
  if (typeof value === "string" && value.startsWith("/api/")) return value;
  if (Array.isArray(value)) {
    const candidate = value.join("/");
    if (candidate.startsWith("/api/")) return candidate;
  }
  return "/api";
}

function buildQueryString(req) {
  const entries = Object.entries(req.query ?? {}).filter(([key]) => key !== "__meruna_path");
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item));
    } else if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export default function handler(req, res) {
  req.url = `${getForwardedPath(req)}${buildQueryString(req)}`;
  return app(req, res);
}
