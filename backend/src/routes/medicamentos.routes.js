const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const router = express.Router();

// GET /api/medicamentos
router.get("/", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * FROM MEDICAMENTO ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/medicamentos/:id
router.get("/:id", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT * FROM MEDICAMENTO WHERE id = :id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Medicamento no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/medicamentos
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { nombre, presentacion, precio_unitario, requiere_receta } = req.body;
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO MEDICAMENTO (nombre, presentacion, precio_unitario, requiere_receta)
       VALUES (:nombre, :presentacion, :precio_unitario, :requiere_receta)
       RETURNING id INTO :id`,
      {
        nombre,
        presentacion,
        precio_unitario,
        requiere_receta: requiere_receta || "N",
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

// PUT /api/medicamentos/:id
router.put("/:id", async (req, res, next) => {
  let conn;
  try {
    const { nombre, presentacion, precio_unitario, requiere_receta } = req.body;
    conn = await getConnection();
    await conn.execute(
      `UPDATE MEDICAMENTO
       SET nombre = :nombre, presentacion = :presentacion,
           precio_unitario = :precio_unitario, requiere_receta = :requiere_receta
       WHERE id = :id`,
      { nombre, presentacion, precio_unitario, requiere_receta, id: req.params.id }
    );
    await conn.commit();
    res.json({ message: "Medicamento actualizado" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE /api/medicamentos/:id
router.delete("/:id", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(`DELETE FROM MEDICAMENTO WHERE id = :id`, [
      req.params.id,
    ]);
    await conn.commit();
    res.json({ message: "Medicamento eliminado" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
