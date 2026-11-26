const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const router = express.Router();

// GET /api/clientes
router.get("/", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * FROM CLIENTE ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/clientes
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { nombre, telefono, direccion_entrega } = req.body;
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO CLIENTE (nombre, telefono, direccion_entrega)
       VALUES (:nombre, :telefono, :direccion_entrega)
       RETURNING id INTO :id`,
      {
        nombre,
        telefono,
        direccion_entrega,
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
