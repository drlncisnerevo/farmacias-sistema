-- =====================================================================
-- Agrega columnas de ubicacion (latitud/longitud) a SUCURSAL
-- Ejecutar UNA SOLA VEZ sobre la base de datos que ya tienes creada
-- =====================================================================

ALTER TABLE SUCURSAL ADD (latitud  NUMBER(10,6));
ALTER TABLE SUCURSAL ADD (longitud NUMBER(10,6));

-- Coordenadas reales aproximadas para las sucursales de prueba
UPDATE SUCURSAL SET latitud = 14.5995, longitud = -90.5062
WHERE nombre = 'Farmacia Oakland Mall';

UPDATE SUCURSAL SET latitud = 14.6333, longitud = -89.9875
WHERE nombre = 'Farmacia Gasolinera Puma Jalapa';

COMMIT;

-- Verificacion
SELECT nombre, departamento, latitud, longitud FROM SUCURSAL;
