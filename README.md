# Sistema Integral de Gestión y Auditoría para Cadena de Farmacias

Prototipo del Examen Privado — Área de Análisis y Desarrollo, Universidad Mariano Gálvez de Guatemala.

Centraliza el control de inventario, activos fijos, flujo de efectivo, planilla, traslados de medicamentos
entre sucursales y coordinación de entregas de una cadena de farmacias en expansión.

## Qué incluye

| Módulo | Descripción |
|---|---|
| **Panel general** | Indicadores clave, tendencia de efectivo de 30 días y flujo por sucursal |
| **Mapa de sucursales** | Mapa de Guatemala (Leaflet + OpenStreetMap) con el resumen de cada sucursal |
| **Inventario, Activos, Efectivo, Traslados, Pedidos** | Operación diaria con búsqueda y filtros. Los traslados ajustan el inventario de ambas sucursales en una sola transacción |
| **Reportes** | Exportación de inventario, efectivo, planilla y activos a **PDF y Excel** |
| **Autenticación y roles** | Login con JWT; contraseñas cifradas con bcrypt; permisos por rol |
| **Bitácora de auditoría** | Registra quién hizo qué y cuándo (altas, cambios, eliminaciones, inicios de sesión, exportaciones) |
| **Modo oscuro** | Alternable, recuerda la preferencia |

### Roles

| Rol | Puede |
|---|---|
| **ADMIN** (Administrador central) | Todo: leer, crear, editar, eliminar, administrar sucursales y ver la bitácora |
| **GERENTE** | Leer, crear y editar (inventario, traslados, pedidos, efectivo…). No elimina ni modifica sucursales |
| **AUDITOR** | Solo lectura, reportes y bitácora |

## Arquitectura

| Capa | Tecnología |
|---|---|
| Base de datos | Oracle Database XE (contenedor Docker) |
| Backend | Node.js + Express (API REST, JWT, ExcelJS, PDFKit) |
| Frontend | React + Vite (Recharts, Leaflet, Lucide) |

```
farmacias-sistema/
├── backend/     API REST (Node.js/Express)
├── frontend/    Aplicación web (React)
└── database/    Scripts SQL (ejecutar en orden: 01, 02, 03)
```

## Puesta en marcha

1. **Docker + Oracle XE**
   ```
   docker run -d --name oracle-xe -p 1521:1521 -e ORACLE_PASSWORD=TuClaveSegura123 gvenzl/oracle-xe:21-slim
   ```
   (si el contenedor ya existe: `docker start oracle-xe`)
2. **Base de datos** — en DBeaver, conectado a `XEPDB1`, ejecutar con *Execute SQL Script* (`Alt+X`) y **en orden**:
   `database/01_crear_tablas.sql` → `02_agregar_coordenadas.sql` → `03_seguridad_y_demo.sql`
   (cada script se ejecuta una sola vez).
3. **Backend**
   ```
   cd backend
   npm install
   copy .env.example .env      (editar DB_PASSWORD y JWT_SECRET)
   npm run dev
   ```
4. **Frontend** (otra terminal)
   ```
   cd frontend
   npm install
   copy .env.example .env
   npm run dev
   ```
5. Abrir `http://localhost:5173` e iniciar sesión.

### Cuentas de demostración

| Usuario | Contraseña | Rol |
|---|---|---|
| admin@farmacias.gt | admin123 | Administrador |
| gerente@farmacias.gt | gerente123 | Gerente |
| auditor@farmacias.gt | auditor123 | Auditor |

> Son cuentas de demostración. En un entorno real se cambian las contraseñas y se define un `JWT_SECRET` propio.

## Autor

[Nombre del estudiante] — Carné [Número de carné]
