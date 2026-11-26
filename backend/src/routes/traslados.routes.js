const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const router = express.Router();

// GET /api/traslados
router.get("/", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT t.id, m.nombre AS medicamento, so.nombre AS sucursal_origen,
              sd.nombre AS sucursal_destino, t.cantidad, t.fecha, t.responsable, t.motivo
       FROM TRASLADO t
       JOIN MEDICAMENTO m ON m.id = t.medicamento_id
       JOIN SUCURSAL so ON so.id = t.sucursal_origen_id
       JOIN SUCURSAL sd ON sd.id = t.sucursal_destino_id
       ORDER BY t.fecha DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/traslados
// Body: { medicamento_id, sucursal_origen_id, sucursal_destino_id, cantidad, responsable, motivo }
// Regla de negocio: descuenta del inventario de origen y suma al de destino, todo en una sola transaccion.
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const {
      medicamento_id,
      sucursal_origen_id,
      sucursal_destino_id,
      cantidad,
      responsable,
      motivo,
    } = req.body;

    if (Number(sucursal_origen_id) === Number(sucursal_destino_id)) {
      return res
        .status(400)
        .json({ error: "La sucursal de origen y destino deben ser distintas" });
    }
    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a cero" });
    }

    conn = await getConnection();

    // 1. Verificar existencia suficiente en la sucursal de origen
    const origenInv = await conn.execute(
      `SELECT cantidad_disponible FROM INVENTARIO
       WHERE sucursal_id = :s AND medicamento_id = :m`,
      { s: sucursal_origen_id, m: medicamento_id }
    );
    if (
      origenInv.rows.length === 0 ||
      origenInv.rows[0].CANTIDAD_DISPONIBLE < cantidad
    ) {
      return res.status(400).json({
        error: "No hay existencia suficiente en la sucursal de origen",
      });
    }

    // 2. Descontar del inventario de origen
    await conn.execute(
      `UPDATE INVENTARIO
       SET cantidad_disponible = cantidad_disponible - :cantidad, fecha_actualizacion = SYSDATE
       WHERE sucursal_id = :s AND medicamento_id = :m`,
      { cantidad, s: sucursal_origen_id, m: medicamento_id }
    );

    // 3. Sumar al inventario de destino (crear el registro si aun no existe ahi)
    const destInv = await conn.execute(
      `SELECT id FROM INVENTARIO WHERE sucursal_id = :s AND medicamento_id = :m`,
      { s: sucursal_destino_id, m: medicamento_id }
    );
    if (destInv.rows.length === 0) {
      await conn.execute(
        `INSERT INTO INVENTARIO (sucursal_id, medicamento_id, cantidad_disponible, stock_minimo)
         VALUES (:s, :m, :cantidad, 0)`,
        { s: sucursal_destino_id, m: medicamento_id, cantidad }
      );
    } else {
      await conn.execute(
        `UPDATE INVENTARIO
         SET cantidad_disponible = cantidad_disponible + :cantidad, fecha_actualizacion = SYSDATE
         WHERE sucursal_id = :s AND medicamento_id = :m`,
        { cantidad, s: sucursal_destino_id, m: medicamento_id }
      );
    }

    // 4. Registrar el traslado (trazabilidad, regla de negocio RN1)
    const result = await conn.execute(
      `INSERT INTO TRASLADO
         (medicamento_id, sucursal_origen_id, sucursal_destino_id, cantidad, responsable, motivo)
       VALUES
         (:medicamento_id, :sucursal_origen_id, :sucursal_destino_id, :cantidad, :responsable, :motivo)
       RETURNING id INTO :id`,
      {
        medicamento_id,
        sucursal_origen_id,
        sucursal_destino_id,
        cantidad,
        responsable,
        motivo,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
      }
    );

    // 5. Confirmar todo junto: si algo falla antes de este punto, nada se guarda
    await conn.commit();
    res.status(201).json({
      id: result.outBinds.id[0],
      message: "Traslado registrado y stock actualizado en ambas sucursales",
    });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
