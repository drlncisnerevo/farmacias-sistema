const express = require("express");
const bcrypt = require("bcryptjs");
const { getConnection } = require("../db");
const { firmarToken, requireAuth } = require("../middleware/auth");
const { registrarBitacora } = require("../bitacora");

const router = express.Router();

// POST /api/auth/login   { email, password }
router.post("/login", async (req, res, next) => {
  let conn;
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Ingresa tu correo y tu contraseña" });
    }

    conn = await getConnection();
    const result = await conn.execute(
      `SELECT id, nombre, email, password_hash, rol, sucursal_id, activo
       FROM USUARIO
       WHERE LOWER(email) = LOWER(:email)`,
      { email }
    );

    const fila = result.rows[0];
    const credencialesOk =
      fila && fila.ACTIVO === "S" && (await bcrypt.compare(password, fila.PASSWORD_HASH));

    if (!credencialesOk) {
      // Mismo mensaje para "no existe" y "clave incorrecta": no revela que correos existen
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    const usuario = {
      id: fila.ID,
      nombre: fila.NOMBRE,
      email: fila.EMAIL,
      rol: fila.ROL,
      sucursal_id: fila.SUCURSAL_ID,
    };

    registrarBitacora({ usuario, accion: "LOGIN", entidad: "auth/login", detalle: "Inicio de sesion" });
    res.json({ token: firmarToken(usuario), usuario });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/auth/me -> datos del usuario autenticado
router.get("/me", requireAuth, (req, res) => {
  res.json({ usuario: req.user });
});

module.exports = router;
