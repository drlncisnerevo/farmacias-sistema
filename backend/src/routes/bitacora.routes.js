const express = require("express");
const { getConnection } = require("../db");
const { soloRoles } = require("../middleware/auth");

const router = express.Router();

// GET /api/bitacora?limit=200  (solo ADMIN y AUDITOR)
router.get("/", soloRoles("ADMIN", "AUDITOR"), async (req, res, next) => {
  let conn;
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT id, fecha, usuario_nombre, rol, accion, entidad, detalle
       FROM BITACORA
       ORDER BY fecha DESC
       FETCH FIRST :limite ROWS ONLY`,
      { limite: limit }
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
