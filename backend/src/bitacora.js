const { getConnection } = require("./db");

// Registra una accion en la tabla BITACORA (historial de auditoria).
// Nunca debe romper la operacion principal: si falla, solo lo reporta en consola.
async function registrarBitacora({ usuario, accion, entidad, detalle }) {
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `INSERT INTO BITACORA (usuario_id, usuario_nombre, rol, accion, entidad, detalle)
       VALUES (:usuario_id, :usuario_nombre, :rol, :accion, :entidad, :detalle)`,
      {
        usuario_id: usuario && usuario.id != null ? usuario.id : null,
        usuario_nombre: (usuario && usuario.nombre) || "desconocido",
        rol: (usuario && usuario.rol) || null,
        accion,
        entidad: (entidad || "").slice(0, 100),
        detalle: (detalle || "").slice(0, 900),
      }
    );
    await conn.commit();
  } catch (err) {
    console.error("No se pudo registrar en la bitacora:", err.message);
  } finally {
    if (conn) {
      try { await conn.close(); } catch (_) { /* ignorar */ }
    }
  }
}

module.exports = { registrarBitacora };
