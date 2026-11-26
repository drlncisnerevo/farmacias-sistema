const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const router = express.Router();

// GET /api/activos-fijos  (con filtro opcional ?sucursal_id=)
router.get("/", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const { sucursal_id } = req.query;
    const sql = `SELECT a.*, s.nombre AS sucursal
                 FROM ACTIVO_FIJO a
                 JOIN SUCURSAL s ON s.id = a.sucursal_id
                 ${sucursal_id ? "WHERE a.sucursal_id = :sucursal_id" : ""}
                 ORDER BY a.id`;
    const result = await conn.execute(
      sql,
      sucursal_id ? { sucursal_id } : []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/activos-fijos
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const {
      sucursal_id,
      descripcion,
      categoria,
      valor_adquisicion,
      fecha_adquisicion,
      valor_actual,
      estado,
    } = req.body;
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO ACTIVO_FIJO
         (sucursal_id, descripcion, categoria, valor_adquisicion, fecha_adquisicion, valor_actual, estado)
       VALUES
         (:sucursal_id, :descripcion, :categoria, :valor_adquisicion, TO_DATE(:fecha_adquisicion,'YYYY-MM-DD'), :valor_actual, :estado)
       RETURNING id INTO :id`,
      {
        sucursal_id,
        descripcion,
        categoria,
        valor_adquisicion,
        fecha_adquisicion,
        valor_actual: valor_actual ?? valor_adquisicion,
        estado: estado || "ACTIVO",
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

// PUT /api/activos-fijos/:id  (ej. dar de baja, actualizar valor actual)
router.put("/:id", async (req, res, next) => {
  let conn;
  try {
    const { descripcion, categoria, valor_actual, estado } = req.body;
    conn = await getConnection();
    await conn.execute(
      `UPDATE ACTIVO_FIJO
       SET descripcion = :descripcion, categoria = :categoria,
           valor_actual = :valor_actual, estado = :estado
       WHERE id = :id`,
      { descripcion, categoria, valor_actual, estado, id: req.params.id }
    );
    await conn.commit();
    res.json({ message: "Activo fijo actualizado" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// DELETE /api/activos-fijos/:id
router.delete("/:id", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(`DELETE FROM ACTIVO_FIJO WHERE id = :id`, [
      req.params.id,
    ]);
    await conn.commit();
    res.json({ message: "Activo fijo eliminado" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
