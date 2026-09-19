// HamTab API client
const API_BASE = "";

function getToken() {
  return localStorage.getItem("hamtab_token");
}

function setToken(token) {
  if (token) localStorage.setItem("hamtab_token", token);
  else localStorage.removeItem("hamtab_token");
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data;
}

window.HamTabAPI = {
  getToken,
  setToken,
  register: (body) => request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/api/auth/me"),
  logoutEverywhere: () => request("/api/auth/logout-everywhere", { method: "POST" }),
  getPackages: () => request("/api/packages"),
  calculate: (body) => request("/api/solar/calculate", { method: "POST", body: JSON.stringify(body) }),
  getOrders: () => request("/api/orders"),
  createOrder: (body, idempotencyKey) =>
    request("/api/orders", {
      method: "POST",
      body: JSON.stringify(body),
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    }),
  payOrder: (id) => request(`/api/orders/${id}/pay`, { method: "POST" }),
  getSystems: () => request("/api/systems"),
  getController: (id) => request(`/api/systems/${id}/controller`),
  getNotifications: () => request("/api/notifications"),
  getNeighborhoods: () => request("/api/neighborhoods"),
  joinNeighborhood: (id) => request(`/api/neighborhoods/${id}/join`, { method: "POST" }),
};
