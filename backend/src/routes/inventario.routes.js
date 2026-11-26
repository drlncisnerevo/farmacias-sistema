const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const router = express.Router();

// GET /api/inventario  -> inventario completo con nombres de sucursal y medicamento
router.get("/", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT i.id, s.id AS sucursal_id, s.nombre AS sucursal, m.id AS medicamento_id,
              m.nombre AS medicamento, i.cantidad_disponible, i.stock_minimo,
              i.fecha_actualizacion
       FROM INVENTARIO i
       JOIN SUCURSAL s ON s.id = i.sucursal_id
       JOIN MEDICAMENTO m ON m.id = i.medicamento_id
       ORDER BY s.nombre, m.nombre`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/inventario/sucursal/:sucursalId -> inventario de una sola sucursal
router.get("/sucursal/:sucursalId", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT i.id, m.id AS medicamento_id, m.nombre AS medicamento,
              i.cantidad_disponible, i.stock_minimo, i.fecha_actualizacion
       FROM INVENTARIO i
       JOIN MEDICAMENTO m ON m.id = i.medicamento_id
       WHERE i.sucursal_id = :sucursalId
       ORDER BY m.nombre`,
      { sucursalId: req.params.sucursalId }
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/inventario/bajo-stock -> medicamentos por debajo del stock minimo (alerta)
router.get("/bajo-stock", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT s.nombre AS sucursal, m.nombre AS medicamento,
              i.cantidad_disponible, i.stock_minimo
       FROM INVENTARIO i
       JOIN SUCURSAL s ON s.id = i.sucursal_id
       JOIN MEDICAMENTO m ON m.id = i.medicamento_id
       WHERE i.cantidad_disponible < i.stock_minimo
       ORDER BY s.nombre`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/inventario -> crear o ajustar manualmente una existencia
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { sucursal_id, medicamento_id, cantidad_disponible, stock_minimo } = req.body;
    conn = await getConnection();

    const existente = await conn.execute(
      `SELECT id FROM INVENTARIO WHERE sucursal_id = :s AND medicamento_id = :m`,
      { s: sucursal_id, m: medicamento_id }
    );

    if (existente.rows.length > 0) {
      await conn.execute(
        `UPDATE INVENTARIO
         SET cantidad_disponible = :cantidad_disponible, stock_minimo = :stock_minimo,
             fecha_actualizacion = SYSDATE
         WHERE sucursal_id = :s AND medicamento_id = :m`,
        { cantidad_disponible, stock_minimo, s: sucursal_id, m: medicamento_id }
      );
    } else {
      await conn.execute(
        `INSERT INTO INVENTARIO (sucursal_id, medicamento_id, cantidad_disponible, stock_minimo)
         VALUES (:s, :m, :cantidad_disponible, :stock_minimo)`,
        { s: sucursal_id, m: medicamento_id, cantidad_disponible, stock_minimo }
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Inventario actualizado" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
