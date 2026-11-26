# Backend — API REST (Node.js + Express + Oracle XE)

## Instalación y ejecución
```
npm install
copy .env.example .env     # editar DB_PASSWORD y JWT_SECRET
npm run dev
```
Salud de la API: http://localhost:4000/api/health

## Seguridad
- `POST /api/auth/login` entrega un token JWT (8 h). Todas las demás rutas lo exigen: `Authorization: Bearer <token>`.
- Permisos por rol aplicados de forma global en `src/middleware/auth.js` (AUDITOR solo lectura; DELETE y sucursales solo ADMIN).
- Toda operación que modifica datos queda en la tabla `BITACORA` (`src/middleware/bitacora.js`).

## Endpoints
| Recurso | Métodos |
|---|---|
| /api/auth | POST /login · GET /me |
| /api/sucursales | GET · GET/:id · POST · PUT/:id · DELETE/:id (escritura: ADMIN) |
| /api/medicamentos | GET · GET/:id · POST · PUT/:id · DELETE/:id |
| /api/inventario | GET · GET /sucursal/:id · GET /bajo-stock · POST |
| /api/activos-fijos | GET (?sucursal_id=) · POST · PUT/:id · DELETE/:id |
| /api/empleados | GET · POST · PUT/:id · DELETE/:id |
| /api/planilla | GET (?periodo=) · GET /resumen · POST |
| /api/movimientos-efectivo | GET · GET /resumen · GET /tendencia?dias=30 · POST |
| /api/traslados | GET · POST (ajusta inventario de origen y destino) |
| /api/clientes | GET · POST |
| /api/pedidos | GET · GET/:id · POST · PUT/:id/estado |
| /api/reportes/:tipo?formato=pdf o xlsx | inventario · efectivo · planilla · activos |
| /api/bitacora | GET (ADMIN y AUDITOR) |
