-- =====================================================================
-- Sistema de Farmacias - Mejoras: seguridad (usuarios/roles), bitacora
-- de auditoria y datos de demostracion para las graficas.
--
-- EJECUTAR UNA SOLA VEZ (despues de 01_crear_tablas.sql y 02_agregar_coordenadas.sql)
-- En DBeaver: abrir el archivo y ejecutar con "Execute SQL Script" (Alt+X).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. USUARIO: cuentas del sistema con su rol
--    (la contrasena se guarda cifrada con bcrypt, nunca en texto plano)
-- ---------------------------------------------------------------------
CREATE TABLE USUARIO (
    id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR2(120) NOT NULL,
    email          VARCHAR2(120) NOT NULL UNIQUE,
    password_hash  VARCHAR2(100) NOT NULL,
    rol            VARCHAR2(20)  NOT NULL CHECK (rol IN ('ADMIN','GERENTE','AUDITOR')),
    sucursal_id    NUMBER,
    activo         CHAR(1) DEFAULT 'S' CHECK (activo IN ('S','N')),
    CONSTRAINT fk_usuario_sucursal FOREIGN KEY (sucursal_id) REFERENCES SUCURSAL(id)
);

-- ---------------------------------------------------------------------
-- 2. BITACORA: historial de auditoria (quien hizo que y cuando)
-- ---------------------------------------------------------------------
CREATE TABLE BITACORA (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha           TIMESTAMP DEFAULT SYSTIMESTAMP,
    usuario_id      NUMBER,
    usuario_nombre  VARCHAR2(120),
    rol             VARCHAR2(20),
    accion          VARCHAR2(40) NOT NULL,
    entidad         VARCHAR2(100),
    detalle         VARCHAR2(1000)
);

-- ---------------------------------------------------------------------
-- 3. Usuarios de demostracion
--      admin@farmacias.gt     /  admin123     (Administrador central)
--      gerente@farmacias.gt   /  gerente123   (Gerente de sucursal)
--      auditor@farmacias.gt   /  auditor123   (Auditor, solo lectura)
-- ---------------------------------------------------------------------
INSERT INTO USUARIO (nombre, email, password_hash, rol, sucursal_id) VALUES
    ('Administrador Central', 'admin@farmacias.gt', '$2b$10$.BhTNal44nnx2NKu/TieDODiVY.NeedkrCvyi6fVaU6SXy/ibCAbG', 'ADMIN', NULL);

INSERT INTO USUARIO (nombre, email, password_hash, rol, sucursal_id)
SELECT 'Maria Lopez (Gerente)', 'gerente@farmacias.gt', '$2b$10$5dkAKgYPjz48ld8m8MSFgedESdFgrBh0dxU0CxLjVI2G2x46KTlfK', 'GERENTE', id
FROM SUCURSAL WHERE nombre = 'Farmacia Oakland Mall';

INSERT INTO USUARIO (nombre, email, password_hash, rol, sucursal_id) VALUES
    ('Auditor Financiero', 'auditor@farmacias.gt', '$2b$10$rwtpbB/XEjYIY54Ps4i4OOUkbRSvzO/QFjFd/GP6ePlIbg9hlZfVe', 'AUDITOR', NULL);

-- ---------------------------------------------------------------------
-- 4. Datos de demostracion: historial de efectivo de los ultimos 10 dias
--    (alimenta la grafica de tendencia del panel general)
-- ---------------------------------------------------------------------
INSERT INTO MOVIMIENTO_EFECTIVO (sucursal_id, tipo, monto, fecha, concepto)
SELECT s.id, 'INGRESO', 1800 + MOD(d.n * 371 + s.id * 113, 900), TRUNC(SYSDATE) - d.n, 'Venta del dia'
FROM SUCURSAL s
CROSS JOIN (SELECT LEVEL AS n FROM dual CONNECT BY LEVEL <= 10) d;

INSERT INTO MOVIMIENTO_EFECTIVO (sucursal_id, tipo, monto, fecha, concepto)
SELECT s.id, 'EGRESO', 600 + d.n * 55, TRUNC(SYSDATE) - d.n, 'Pago de proveedor'
FROM SUCURSAL s
CROSS JOIN (SELECT LEVEL AS n FROM dual CONNECT BY LEVEL <= 10) d
WHERE MOD(d.n, 3) = 0;

-- ---------------------------------------------------------------------
-- 5. Datos de demostracion adicionales (stock bajo, egreso grande, activo en mantenimiento)
-- ---------------------------------------------------------------------
-- Stock bajo: Amoxicilina en Jalapa (3 unidades, minimo 15)
INSERT INTO INVENTARIO (sucursal_id, medicamento_id, cantidad_disponible, stock_minimo)
SELECT s.id, m.id, 3, 15
FROM SUCURSAL s, MEDICAMENTO m
WHERE s.nombre = 'Farmacia Gasolinera Puma Jalapa' AND m.nombre = 'Amoxicilina 500mg';

-- Egreso grande reciente
INSERT INTO MOVIMIENTO_EFECTIVO (sucursal_id, tipo, monto, fecha, concepto)
SELECT id, 'EGRESO', 3200, SYSDATE - 1, 'Compra de equipo refrigerado'
FROM SUCURSAL WHERE nombre = 'Farmacia Gasolinera Puma Jalapa';

-- Activo en mantenimiento
INSERT INTO ACTIVO_FIJO (sucursal_id, descripcion, categoria, valor_adquisicion, fecha_adquisicion, valor_actual, estado)
SELECT id, 'Refrigerador de vacunas', 'Equipo', 8500.00, DATE '2025-06-10', 7600.00, 'EN_MANTENIMIENTO'
FROM SUCURSAL WHERE nombre = 'Farmacia Oakland Mall';

COMMIT;

-- Verificacion: deben aparecer los 3 usuarios
SELECT nombre, email, rol FROM USUARIO;
