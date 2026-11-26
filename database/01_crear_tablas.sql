-- =====================================================================
-- Sistema Integral de Gestion y Auditoria para Cadena de Farmacias
-- Script de creacion de tablas - Oracle XE
-- Ejecutar como usuario SYSTEM (o un usuario/schema propio) en XEPDB1
-- =====================================================================

-- Limpieza opcional (comenta estas lineas en la primera ejecucion)
-- DROP TABLE DETALLE_PEDIDO PURGE;
-- DROP TABLE PEDIDO PURGE;
-- DROP TABLE CLIENTE PURGE;
-- DROP TABLE TRASLADO PURGE;
-- DROP TABLE MOVIMIENTO_EFECTIVO PURGE;
-- DROP TABLE PLANILLA PURGE;
-- DROP TABLE EMPLEADO PURGE;
-- DROP TABLE ACTIVO_FIJO PURGE;
-- DROP TABLE INVENTARIO PURGE;
-- DROP TABLE MEDICAMENTO PURGE;
-- DROP TABLE SUCURSAL PURGE;

-- =====================================================================
-- 1. SUCURSAL
-- =====================================================================
CREATE TABLE SUCURSAL (
    id              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          VARCHAR2(100) NOT NULL,
    tipo            VARCHAR2(30)  NOT NULL CHECK (tipo IN ('CENTRO_COMERCIAL','GASOLINERA')),
    departamento    VARCHAR2(60)  NOT NULL,
    direccion       VARCHAR2(200),
    telefono        VARCHAR2(20),
    fecha_apertura  DATE DEFAULT SYSDATE
);

-- =====================================================================
-- 2. MEDICAMENTO
-- =====================================================================
CREATE TABLE MEDICAMENTO (
    id               NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           VARCHAR2(150) NOT NULL,
    presentacion     VARCHAR2(60),
    precio_unitario  NUMBER(10,2) NOT NULL CHECK (precio_unitario >= 0),
    requiere_receta  CHAR(1) DEFAULT 'N' CHECK (requiere_receta IN ('S','N'))
);

-- =====================================================================
-- 3. INVENTARIO (Sucursal <-> Medicamento)
-- =====================================================================
CREATE TABLE INVENTARIO (
    id                   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sucursal_id          NUMBER NOT NULL,
    medicamento_id       NUMBER NOT NULL,
    cantidad_disponible  NUMBER DEFAULT 0 CHECK (cantidad_disponible >= 0),
    stock_minimo         NUMBER DEFAULT 0,
    fecha_actualizacion  DATE DEFAULT SYSDATE,
    CONSTRAINT fk_inv_sucursal    FOREIGN KEY (sucursal_id)    REFERENCES SUCURSAL(id),
    CONSTRAINT fk_inv_medicamento FOREIGN KEY (medicamento_id) REFERENCES MEDICAMENTO(id),
    CONSTRAINT uq_inv_suc_med UNIQUE (sucursal_id, medicamento_id)
);

-- =====================================================================
-- 4. ACTIVO_FIJO
-- =====================================================================
CREATE TABLE ACTIVO_FIJO (
    id                 NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sucursal_id        NUMBER NOT NULL,
    descripcion        VARCHAR2(150) NOT NULL,
    categoria          VARCHAR2(60),
    valor_adquisicion  NUMBER(12,2) NOT NULL,
    fecha_adquisicion  DATE NOT NULL,
    valor_actual       NUMBER(12,2),
    estado             VARCHAR2(30) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO','DE_BAJA','EN_MANTENIMIENTO')),
    CONSTRAINT fk_activo_sucursal FOREIGN KEY (sucursal_id) REFERENCES SUCURSAL(id)
);

-- =====================================================================
-- 5. EMPLEADO
-- =====================================================================
CREATE TABLE EMPLEADO (
    id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sucursal_id    NUMBER NOT NULL,
    nombre         VARCHAR2(120) NOT NULL,
    puesto         VARCHAR2(60),
    fecha_ingreso  DATE DEFAULT SYSDATE,
    CONSTRAINT fk_empleado_sucursal FOREIGN KEY (sucursal_id) REFERENCES SUCURSAL(id)
);

-- =====================================================================
-- 6. PLANILLA
-- =====================================================================
CREATE TABLE PLANILLA (
    id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empleado_id    NUMBER NOT NULL,
    periodo        VARCHAR2(20) NOT NULL,
    salario_base   NUMBER(10,2) NOT NULL,
    bonificaciones NUMBER(10,2) DEFAULT 0,
    descuentos     NUMBER(10,2) DEFAULT 0,
    total_pagado   NUMBER(10,2) GENERATED ALWAYS AS (salario_base + bonificaciones - descuentos) VIRTUAL,
    CONSTRAINT fk_planilla_empleado FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(id)
);

-- =====================================================================
-- 7. MOVIMIENTO_EFECTIVO
-- =====================================================================
CREATE TABLE MOVIMIENTO_EFECTIVO (
    id           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sucursal_id  NUMBER NOT NULL,
    tipo         VARCHAR2(10) NOT NULL CHECK (tipo IN ('INGRESO','EGRESO')),
    monto        NUMBER(12,2) NOT NULL CHECK (monto > 0),
    fecha        DATE DEFAULT SYSDATE,
    concepto     VARCHAR2(200),
    CONSTRAINT fk_mov_sucursal FOREIGN KEY (sucursal_id) REFERENCES SUCURSAL(id)
);

-- =====================================================================
-- 8. TRASLADO (movimiento de medicamentos entre sucursales)
-- =====================================================================
CREATE TABLE TRASLADO (
    id                   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    medicamento_id       NUMBER NOT NULL,
    sucursal_origen_id   NUMBER NOT NULL,
    sucursal_destino_id  NUMBER NOT NULL,
    cantidad             NUMBER NOT NULL CHECK (cantidad > 0),
    fecha                DATE DEFAULT SYSDATE,
    responsable          VARCHAR2(120),
    motivo               VARCHAR2(200),
    CONSTRAINT fk_tras_medicamento FOREIGN KEY (medicamento_id)      REFERENCES MEDICAMENTO(id),
    CONSTRAINT fk_tras_origen      FOREIGN KEY (sucursal_origen_id)  REFERENCES SUCURSAL(id),
    CONSTRAINT fk_tras_destino     FOREIGN KEY (sucursal_destino_id) REFERENCES SUCURSAL(id),
    CONSTRAINT ck_tras_distinto    CHECK (sucursal_origen_id <> sucursal_destino_id)
);

-- =====================================================================
-- 9. CLIENTE
-- =====================================================================
CREATE TABLE CLIENTE (
    id                 NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre             VARCHAR2(120) NOT NULL,
    telefono           VARCHAR2(20),
    direccion_entrega  VARCHAR2(200)
);

-- =====================================================================
-- 10. PEDIDO
-- =====================================================================
CREATE TABLE PEDIDO (
    id                     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id             NUMBER NOT NULL,
    sucursal_id            NUMBER NOT NULL,
    fecha_pedido           DATE DEFAULT SYSDATE,
    estado                 VARCHAR2(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','EN_CAMINO','ENTREGADO','CANCELADO')),
    forma_pago             VARCHAR2(30),
    tiempo_estimado_min    NUMBER,
    CONSTRAINT fk_pedido_cliente  FOREIGN KEY (cliente_id)  REFERENCES CLIENTE(id),
    CONSTRAINT fk_pedido_sucursal FOREIGN KEY (sucursal_id) REFERENCES SUCURSAL(id)
);

-- =====================================================================
-- 11. DETALLE_PEDIDO
-- =====================================================================
CREATE TABLE DETALLE_PEDIDO (
    id               NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id        NUMBER NOT NULL,
    medicamento_id   NUMBER NOT NULL,
    cantidad         NUMBER NOT NULL CHECK (cantidad > 0),
    precio_unitario  NUMBER(10,2) NOT NULL,
    CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id)      REFERENCES PEDIDO(id),
    CONSTRAINT fk_detalle_med    FOREIGN KEY (medicamento_id) REFERENCES MEDICAMENTO(id)
);

-- =====================================================================
-- DATOS DE PRUEBA
-- =====================================================================
INSERT INTO SUCURSAL (nombre, tipo, departamento, direccion, telefono) VALUES
    ('Farmacia Oakland Mall', 'CENTRO_COMERCIAL', 'Guatemala', 'Km 13.5 Carretera a El Salvador', '2222-1111');
INSERT INTO SUCURSAL (nombre, tipo, departamento, direccion, telefono) VALUES
    ('Farmacia Gasolinera Puma Jalapa', 'GASOLINERA', 'Jalapa', 'Ruta a Jalapa km 100', '2222-2222');

INSERT INTO MEDICAMENTO (nombre, presentacion, precio_unitario, requiere_receta) VALUES
    ('Acetaminofen 500mg', 'Caja x 20 tabletas', 15.50, 'N');
INSERT INTO MEDICAMENTO (nombre, presentacion, precio_unitario, requiere_receta) VALUES
    ('Amoxicilina 500mg', 'Caja x 12 capsulas', 45.00, 'S');

INSERT INTO INVENTARIO (sucursal_id, medicamento_id, cantidad_disponible, stock_minimo) VALUES (1, 1, 200, 30);
INSERT INTO INVENTARIO (sucursal_id, medicamento_id, cantidad_disponible, stock_minimo) VALUES (1, 2, 80, 15);
INSERT INTO INVENTARIO (sucursal_id, medicamento_id, cantidad_disponible, stock_minimo) VALUES (2, 1, 50, 10);

INSERT INTO ACTIVO_FIJO (sucursal_id, descripcion, categoria, valor_adquisicion, fecha_adquisicion, valor_actual) VALUES
    (1, 'Estanteria metalica', 'Mobiliario', 2500.00, DATE '2025-01-15', 2100.00);

INSERT INTO EMPLEADO (sucursal_id, nombre, puesto) VALUES (1, 'Maria Lopez', 'Gerente de sucursal');
INSERT INTO EMPLEADO (sucursal_id, nombre, puesto) VALUES (2, 'Carlos Ramirez', 'Encargado de inventario');

INSERT INTO PLANILLA (empleado_id, periodo, salario_base, bonificaciones, descuentos) VALUES
    (1, '2026-08', 4500.00, 300.00, 150.00);

INSERT INTO MOVIMIENTO_EFECTIVO (sucursal_id, tipo, monto, concepto) VALUES (1, 'INGRESO', 3200.50, 'Venta del dia');
INSERT INTO MOVIMIENTO_EFECTIVO (sucursal_id, tipo, monto, concepto) VALUES (1, 'EGRESO', 450.00, 'Pago de proveedor');

INSERT INTO TRASLADO (medicamento_id, sucursal_origen_id, sucursal_destino_id, cantidad, responsable, motivo) VALUES
    (2, 1, 2, 20, 'Carlos Ramirez', 'Reabastecimiento por baja existencia');

INSERT INTO CLIENTE (nombre, telefono, direccion_entrega) VALUES
    ('Ana Gomez', '5555-1234', '3a avenida 5-10 zona 1, Jalapa');

INSERT INTO PEDIDO (cliente_id, sucursal_id, forma_pago, tiempo_estimado_min) VALUES
    (1, 2, 'TARJETA', 40);

INSERT INTO DETALLE_PEDIDO (pedido_id, medicamento_id, cantidad, precio_unitario) VALUES
    (1, 1, 2, 15.50);

COMMIT;

-- =====================================================================
-- CONSULTAS DE VERIFICACION
-- =====================================================================
SELECT s.nombre AS sucursal, m.nombre AS medicamento, i.cantidad_disponible
FROM INVENTARIO i
JOIN SUCURSAL s ON s.id = i.sucursal_id
JOIN MEDICAMENTO m ON m.id = i.medicamento_id
ORDER BY s.nombre;

SELECT s.nombre AS sucursal, SUM(CASE WHEN me.tipo='INGRESO' THEN me.monto ELSE -me.monto END) AS flujo_neto
FROM MOVIMIENTO_EFECTIVO me
JOIN SUCURSAL s ON s.id = me.sucursal_id
GROUP BY s.nombre;
