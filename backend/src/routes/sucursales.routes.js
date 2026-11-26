const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const router = express.Router();

// GET /api/sucursales
router.get("/", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * FROM SUCURSAL ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/sucursales/:id
router.get("/:id", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM SUCURSAL WHERE id = :id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sucursal no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/sucursales
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { nombre, tipo, departamento, direccion, telefono, latitud, longitud } = req.body;
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO SUCURSAL (nombre, tipo, departamento, direccion, telefono, latitud, longitud)
       VALUES (:nombre, :tipo, :departamento, :direccion, :telefono, :latitud, :longitud)
       RETURNING id INTO :id`,
      {
        nombre,
        tipo,
        departamento,
        direccion,
        telefono,
        latitud: latitud ?? null,
        longitud: longitud ?? null,
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

// PUT /api/sucursales/:id
router.put("/:id", async (req, res, next) => {
  let conn;
  try {
    const { nombre, tipo, departamento, direccion, telefono, latitud, longitud } = req.body;
    conn = await getConnection();
    await conn.execute(
      `UPDATE SUCURSAL
       SET nombre = :nombre, tipo = :tipo, departamento = :departamento,
           direccion = :direccion, telefono = :telefono,
           latitud = :latitud, longitud = :longitud
       WHERE id = :id`,
      { nombre, tipo, departamento, direccion, telefono, latitud, longitud, id: req.params.id }
    );
    await conn.commit();
    res.json({ message: "Sucursal actualizada" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE /api/sucursales/:id
router.delete("/:id", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(`DELETE FROM SUCURSAL WHERE id = :id`, [
      req.params.id,
    ]);
    await conn.commit();
    res.json({ message: "Sucursal eliminada" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
