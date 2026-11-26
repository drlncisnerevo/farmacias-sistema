const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const router = express.Router();

// GET /api/planilla  (con filtro opcional ?periodo=2026-08)
router.get("/", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const { periodo } = req.query;
    const sql = `SELECT p.id, e.nombre AS empleado, s.nombre AS sucursal, p.periodo,
                        p.salario_base, p.bonificaciones, p.descuentos, p.total_pagado
                 FROM PLANILLA p
                 JOIN EMPLEADO e ON e.id = p.empleado_id
                 JOIN SUCURSAL s ON s.id = e.sucursal_id
                 ${periodo ? "WHERE p.periodo = :periodo" : ""}
                 ORDER BY p.periodo DESC, s.nombre`;
    const result = await conn.execute(sql, periodo ? { periodo } : []);
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/planilla/resumen -> total de planilla por sucursal (para auditoria)
router.get("/resumen", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT s.nombre AS sucursal, p.periodo, SUM(p.total_pagado) AS total_planilla
       FROM PLANILLA p
       JOIN EMPLEADO e ON e.id = p.empleado_id
       JOIN SUCURSAL s ON s.id = e.sucursal_id
       GROUP BY s.nombre, p.periodo
       ORDER BY p.periodo DESC, s.nombre`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/planilla
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { empleado_id, periodo, salario_base, bonificaciones, descuentos } = req.body;
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO PLANILLA (empleado_id, periodo, salario_base, bonificaciones, descuentos)
       VALUES (:empleado_id, :periodo, :salario_base, :bonificaciones, :descuentos)
       RETURNING id INTO :id`,
      {
        empleado_id,
        periodo,
        salario_base,
        bonificaciones: bonificaciones || 0,
        descuentos: descuentos || 0,
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
