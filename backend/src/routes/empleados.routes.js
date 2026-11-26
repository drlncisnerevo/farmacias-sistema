const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const router = express.Router();

// GET /api/empleados
router.get("/", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT e.*, s.nombre AS sucursal
       FROM EMPLEADO e
       JOIN SUCURSAL s ON s.id = e.sucursal_id
       ORDER BY e.id`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/empleados
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { sucursal_id, nombre, puesto } = req.body;
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO EMPLEADO (sucursal_id, nombre, puesto)
       VALUES (:sucursal_id, :nombre, :puesto)
       RETURNING id INTO :id`,
      {
        sucursal_id,
        nombre,
        puesto,
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

// PUT /api/empleados/:id
router.put("/:id", async (req, res, next) => {
  let conn;
  try {
    const { nombre, puesto } = req.body;
    conn = await getConnection();
    await conn.execute(
      `UPDATE EMPLEADO SET nombre = :nombre, puesto = :puesto WHERE id = :id`,
      { nombre, puesto, id: req.params.id }
    );
    await conn.commit();
    res.json({ message: "Empleado actualizado" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE /api/empleados/:id
router.delete("/:id", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(`DELETE FROM EMPLEADO WHERE id = :id`, [
      req.params.id,
    ]);
    await conn.commit();
    res.json({ message: "Empleado eliminado" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
