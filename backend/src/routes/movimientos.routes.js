const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const router = express.Router();

// GET /api/movimientos-efectivo  (filtro opcional ?sucursal_id=)
router.get("/", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const { sucursal_id } = req.query;
    const sql = `SELECT m.id, s.nombre AS sucursal, m.tipo, m.monto, m.fecha, m.concepto
                 FROM MOVIMIENTO_EFECTIVO m
                 JOIN SUCURSAL s ON s.id = m.sucursal_id
                 ${sucursal_id ? "WHERE m.sucursal_id = :sucursal_id" : ""}
                 ORDER BY m.fecha DESC`;
    const result = await conn.execute(sql, sucursal_id ? { sucursal_id } : []);
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/movimientos-efectivo/resumen -> flujo neto por sucursal (auditoria en tiempo real)
router.get("/resumen", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT s.nombre AS sucursal,
              SUM(CASE WHEN m.tipo = 'INGRESO' THEN m.monto ELSE 0 END) AS total_ingresos,
              SUM(CASE WHEN m.tipo = 'EGRESO' THEN m.monto ELSE 0 END) AS total_egresos,
              SUM(CASE WHEN m.tipo = 'INGRESO' THEN m.monto ELSE -m.monto END) AS flujo_neto
       FROM MOVIMIENTO_EFECTIVO m
       JOIN SUCURSAL s ON s.id = m.sucursal_id
       GROUP BY s.nombre
       ORDER BY s.nombre`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/movimientos-efectivo/tendencia?dias=30 -> ingresos y egresos por dia (para graficas)
router.get("/tendencia", async (req, res, next) => {
  let conn;
  try {
    const dias = Math.min(Number(req.query.dias) || 30, 365);
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT TO_CHAR(TRUNC(fecha), 'YYYY-MM-DD') AS dia,
              SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END) AS ingresos,
              SUM(CASE WHEN tipo = 'EGRESO' THEN monto ELSE 0 END) AS egresos
       FROM MOVIMIENTO_EFECTIVO
       WHERE fecha >= TRUNC(SYSDATE) - :dias
       GROUP BY TO_CHAR(TRUNC(fecha), 'YYYY-MM-DD')
       ORDER BY 1`,
      { dias }
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/movimientos-efectivo
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { sucursal_id, tipo, monto, concepto } = req.body;
    if (!["INGRESO", "EGRESO"].includes(tipo)) {
      return res.status(400).json({ error: "El tipo debe ser INGRESO o EGRESO" });
    }
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO MOVIMIENTO_EFECTIVO (sucursal_id, tipo, monto, concepto)
       VALUES (:sucursal_id, :tipo, :monto, :concepto)
       RETURNING id INTO :id`,
      {
        sucursal_id,
        tipo,
        monto,
        concepto,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
      }
    );
    await conn.commit();
    res.status(201).json({ id: result.outBinds.id[0] });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
