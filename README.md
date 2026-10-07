# Sistema Integral de Gestión y Auditoría para Cadena de Farmacias

Prototipo desarrollado para el Examen Privado — Área de Análisis y Desarrollo,
Universidad Mariano Gálvez de Guatemala.

Sistema que centraliza el control de inventario, activos fijos, flujo de
efectivo, planilla, traslados de medicamentos entre sucursales y
coordinación de entregas para una cadena de farmacias en expansión.

## Arquitectura

| Capa           | Tecnología                                   |
|----------------|-----------------------------------------------|
| Base de datos  | Oracle Database XE (contenedor Docker local)  |
| Backend        | Node.js + Express (API REST)                  |
| Frontend       | React + Vite                                  |

## Estructura del repositorio

```
farmacias-sistema/
├── backend/     API REST (Node.js/Express) conectada a Oracle XE
└── frontend/    Aplicación web (React)
```

Cada carpeta tiene su propio `README.md` con instrucciones detalladas de
instalación y ejecución.

## Puesta en marcha rápida

1. Levantar Oracle XE en Docker:
   ```
   docker run -d --name oracle-xe -p 1521:1521 -e ORACLE_PASSWORD=TuClaveSegura123 gvenzl/oracle-xe:21-slim
   ```
2. Crear las tablas (ver `backend/crear_tablas_farmacias.sql` o la carpeta de
   documentación del proyecto).
3. Backend:
   ```
   cd backend
   npm install
   npm run dev
   ```
4. Frontend (en otra terminal):
   ```
   cd frontend
   npm install
   npm run dev
   ```
5. Abrir `http://localhost:5173`.

## Módulos del sistema

- **Panel general**: indicadores de auditoría en tiempo real.
- **Inventario**: existencias por sucursal con alertas de stock mínimo.
- **Activos fijos**: registro y valorización de activos por sucursal.
- **Flujo de efectivo**: auditoría de ingresos y egresos por sucursal.
- **Traslados**: movimiento de medicamentos entre sucursales con ajuste
  automático de inventario.
- **Pedidos y entregas**: registro de clientes y pedidos, preparado para la
  futura integración con un portal/call center centralizado.

## Autor

Darlin Cisneros — Carné 1965 20 17695
