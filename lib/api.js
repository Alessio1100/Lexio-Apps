// Helper fetch JSON per i client components.
async function j(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "content-type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = (await res.json()).error || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (u) => j(u),
  post: (u, b) => j(u, { method: "POST", body: JSON.stringify(b || {}) }),
  put: (u, b) => j(u, { method: "PUT", body: JSON.stringify(b || {}) }),
  patch: (u, b) => j(u, { method: "PATCH", body: JSON.stringify(b || {}) }),
  del: (u) => j(u, { method: "DELETE" }),
};
