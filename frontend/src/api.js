import { getToken } from "./session.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function cabeceras(extra = {}) {
  const token = getToken();
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  // Si habia sesion y el servidor dice 401, el token vencio: se cierra la sesion
  if (res.status === 401 && getToken()) {
    window.dispatchEvent(new Event("farmacias:sesion-expirada"));
  }
  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

const json = { "Content-Type": "application/json" };

export const api = {
  get: (path) => fetch(`${BASE_URL}${path}`, { headers: cabeceras() }).then(handleResponse),

  post: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: cabeceras(json),
      body: JSON.stringify(body),
    }).then(handleResponse),

  put: (path, body) =>
    fetch(`${BASE_URL}${path}`, {
      method: "PUT",
      headers: cabeceras(json),
      body: JSON.stringify(body),
    }).then(handleResponse),

  del: (path) =>
    fetch(`${BASE_URL}${path}`, { method: "DELETE", headers: cabeceras() }).then(handleResponse),
};

// Descarga un archivo (PDF/Excel) que requiere sesion iniciada
export async function descargar(path, nombreArchivo) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: cabeceras() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
