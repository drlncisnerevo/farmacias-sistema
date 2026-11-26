// Manejo de la sesion guardada en el navegador (token + datos del usuario)
export const SESION_KEY = "farmacias_sesion";

export function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(SESION_KEY));
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
}

export function borrarSesion() {
  localStorage.removeItem(SESION_KEY);
}

export function getToken() {
  const s = leerSesion();
  return s ? s.token : null;
}
