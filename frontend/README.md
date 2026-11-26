# Frontend — React + Vite

## Instalación y ejecución
```
npm install
copy .env.example .env     # VITE_API_URL=http://localhost:4000/api
npm run dev
```
Abrir http://localhost:5173 (el backend debe estar corriendo).

## Estructura
- `src/auth/` — contexto de sesión (login, logout, permisos por rol)
- `src/pages/` — Login, Panel, Mapa, Inventario, Activos, Efectivo, Traslados, Pedidos, Reportes, Bitácora
- `src/components/` — Menú lateral (con modo oscuro) y buscador reutilizable
- `src/api.js` — cliente de la API (agrega el token automáticamente)
