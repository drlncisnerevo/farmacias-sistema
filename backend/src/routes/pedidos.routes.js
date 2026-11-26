const express = require("express");
const oracledb = require("oracledb");
const { getConnection } = require("../db");

const router = express.Router();

// GET /api/pedidos -> lista general con datos de cliente y sucursal
router.get("/", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT p.id, c.nombre AS cliente, s.nombre AS sucursal, p.fecha_pedido,
              p.estado, p.forma_pago, p.tiempo_estimado_min
       FROM PEDIDO p
       JOIN CLIENTE c ON c.id = p.cliente_id
       JOIN SUCURSAL s ON s.id = p.sucursal_id
       ORDER BY p.fecha_pedido DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// GET /api/pedidos/:id -> detalle completo de un pedido (encabezado + lineas)
router.get("/:id", async (req, res, next) => {
  let conn;
  try {
    conn = await getConnection();
    const encabezado = await conn.execute(
      `SELECT p.id, c.nombre AS cliente, c.direccion_entrega, s.nombre AS sucursal,
              p.fecha_pedido, p.estado, p.forma_pago, p.tiempo_estimado_min
       FROM PEDIDO p
       JOIN CLIENTE c ON c.id = p.cliente_id
       JOIN SUCURSAL s ON s.id = p.sucursal_id
       WHERE p.id = :id`,
      [req.params.id]
    );
    if (encabezado.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    const detalle = await conn.execute(
      `SELECT dp.id, m.nombre AS medicamento, dp.cantidad, dp.precio_unitario,
              (dp.cantidad * dp.precio_unitario) AS subtotal
       FROM DETALLE_PEDIDO dp
       JOIN MEDICAMENTO m ON m.id = dp.medicamento_id
       WHERE dp.pedido_id = :id`,
      [req.params.id]
    );
    res.json({ ...encabezado.rows[0], detalle: detalle.rows });
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// POST /api/pedidos
// Body: { cliente_id, sucursal_id, forma_pago, tiempo_estimado_min,
//         detalles: [{ medicamento_id, cantidad, precio_unitario }] }
// La sucursal se asigna desde el frontend (o a futuro, automaticamente segun
// ubicacion/disponibilidad) cumpliendo la regla de negocio RN5.
router.post("/", async (req, res, next) => {
  let conn;
  try {
    const { cliente_id, sucursal_id, forma_pago, tiempo_estimado_min, detalles } =
      req.body;

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res
        .status(400)
        .json({ error: "El pedido debe incluir al menos un medicamento" });
    }

    conn = await getConnection();

    const pedidoResult = await conn.execute(
      `INSERT INTO PEDIDO (cliente_id, sucursal_id, forma_pago, tiempo_estimado_min)
       VALUES (:cliente_id, :sucursal_id, :forma_pago, :tiempo_estimado_min)
       RETURNING id INTO :id`,
      {
        cliente_id,
        sucursal_id,
        forma_pago,
        tiempo_estimado_min,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
      }
    );
    const pedidoId = pedidoResult.outBinds.id[0];

    for (const linea of detalles) {
      await conn.execute(
        `INSERT INTO DETALLE_PEDIDO (pedido_id, medicamento_id, cantidad, precio_unitario)
         VALUES (:pedido_id, :medicamento_id, :cantidad, :precio_unitario)`,
        {
          pedido_id: pedidoId,
          medicamento_id: linea.medicamento_id,
          cantidad: linea.cantidad,
          precio_unitario: linea.precio_unitario,
        }
      );
    }

    await conn.commit();
    res
      .status(201)
      .json({ id: pedidoId, message: "Pedido creado con su detalle" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

// PUT /api/pedidos/:id/estado  -> actualizar el estado de la entrega
router.put("/:id/estado", async (req, res, next) => {
  let conn;
  try {
    const { estado } = req.body;
    const validos = ["PENDIENTE", "EN_CAMINO", "ENTREGADO", "CANCELADO"];
    if (!validos.includes(estado)) {
      return res.status(400).json({ error: `Estado invalido. Use uno de: ${validos.join(", ")}` });
    }
    conn = await getConnection();
    await conn.execute(
      `UPDATE PEDIDO SET estado = :estado WHERE id = :id`,
      { estado, id: req.params.id }
    );
    await conn.commit();
    res.json({ message: "Estado del pedido actualizado" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
