const express = require("express");
const { getConnection } = require("../db");
const { generarExcel, generarPDF } = require("../reportes/generador");
const { registrarBitacora } = require("../bitacora");

const router = express.Router();

const moneda = (n) => `Q${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const suma = (filas, k) => filas.reduce((a, f) => a + Number(f[k] || 0), 0);

// Definicion de cada reporte: consulta SQL, columnas y lineas de resumen
const REPORTES = {
  inventario: {
    titulo: "Reporte de inventario por sucursal",
    sql: `SELECT s.nombre AS SUCURSAL, m.nombre AS MEDICAMENTO, i.cantidad_disponible AS DISPONIBLE,
                 i.stock_minimo AS STOCK_MINIMO,
                 CASE WHEN i.cantidad_disponible < i.stock_minimo THEN 'BAJO STOCK' ELSE 'OK' END AS ESTADO,
                 i.fecha_actualizacion AS ACTUALIZADO
          FROM INVENTARIO i
          JOIN SUCURSAL s ON s.id = i.sucursal_id
          JOIN MEDICAMENTO m ON m.id = i.medicamento_id
          ORDER BY s.nombre, m.nombre`,
    columnas: [
      { header: "Sucursal", key: "SUCURSAL", width: 30 },
      { header: "Medicamento", key: "MEDICAMENTO", width: 28 },
      { header: "Disponible", key: "DISPONIBLE", width: 12, tipo: "numero" },
      { header: "Stock mínimo", key: "STOCK_MINIMO", width: 13, tipo: "numero" },
      { header: "Estado", key: "ESTADO", width: 14 },
      { header: "Actualizado", key: "ACTUALIZADO", width: 20, tipo: "fecha" },
    ],
    resumen: (f) => [
      `Registros: ${f.length}`,
      `Con stock bajo el mínimo: ${f.filter((x) => x.ESTADO === "BAJO STOCK").length}`,
    ],
  },
  efectivo: {
    titulo: "Reporte de flujo de efectivo (auditoría)",
    sql: `SELECT s.nombre AS SUCURSAL, m.fecha AS FECHA, m.tipo AS TIPO, m.monto AS MONTO, m.concepto AS CONCEPTO
          FROM MOVIMIENTO_EFECTIVO m
          JOIN SUCURSAL s ON s.id = m.sucursal_id
          ORDER BY m.fecha DESC`,
    columnas: [
      { header: "Sucursal", key: "SUCURSAL", width: 30 },
      { header: "Fecha", key: "FECHA", width: 20, tipo: "fecha" },
      { header: "Tipo", key: "TIPO", width: 12 },
      { header: "Monto", key: "MONTO", width: 16, tipo: "moneda" },
      { header: "Concepto", key: "CONCEPTO", width: 38 },
    ],
    resumen: (f) => {
      const ing = suma(f.filter((x) => x.TIPO === "INGRESO"), "MONTO");
      const egr = suma(f.filter((x) => x.TIPO === "EGRESO"), "MONTO");
      return [`Ingresos: ${moneda(ing)}   |   Egresos: ${moneda(egr)}   |   Flujo neto: ${moneda(ing - egr)}`];
    },
  },
  planilla: {
    titulo: "Reporte de gastos de planilla",
    sql: `SELECT s.nombre AS SUCURSAL, e.nombre AS EMPLEADO, p.periodo AS PERIODO,
                 p.salario_base AS SALARIO_BASE, p.bonificaciones AS BONIFICACIONES,
                 p.descuentos AS DESCUENTOS, p.total_pagado AS TOTAL_PAGADO
          FROM PLANILLA p
          JOIN EMPLEADO e ON e.id = p.empleado_id
          JOIN SUCURSAL s ON s.id = e.sucursal_id
          ORDER BY p.periodo DESC, s.nombre, e.nombre`,
    columnas: [
      { header: "Sucursal", key: "SUCURSAL", width: 28 },
      { header: "Empleado", key: "EMPLEADO", width: 24 },
      { header: "Periodo", key: "PERIODO", width: 11 },
      { header: "Salario base", key: "SALARIO_BASE", width: 15, tipo: "moneda" },
      { header: "Bonificaciones", key: "BONIFICACIONES", width: 15, tipo: "moneda" },
      { header: "Descuentos", key: "DESCUENTOS", width: 14, tipo: "moneda" },
      { header: "Total pagado", key: "TOTAL_PAGADO", width: 15, tipo: "moneda" },
    ],
    resumen: (f) => [`Total de planilla: ${moneda(suma(f, "TOTAL_PAGADO"))}   |   Registros: ${f.length}`],
  },
  activos: {
    titulo: "Reporte de activos fijos",
    sql: `SELECT s.nombre AS SUCURSAL, a.descripcion AS DESCRIPCION, a.categoria AS CATEGORIA,
                 a.fecha_adquisicion AS FECHA_ADQUISICION, a.valor_adquisicion AS VALOR_ADQUISICION,
                 a.valor_actual AS VALOR_ACTUAL, a.estado AS ESTADO
          FROM ACTIVO_FIJO a
          JOIN SUCURSAL s ON s.id = a.sucursal_id
          ORDER BY s.nombre, a.descripcion`,
    columnas: [
      { header: "Sucursal", key: "SUCURSAL", width: 28 },
      { header: "Descripción", key: "DESCRIPCION", width: 28 },
      { header: "Categoría", key: "CATEGORIA", width: 16 },
      { header: "Adquirido", key: "FECHA_ADQUISICION", width: 18, tipo: "fecha" },
      { header: "Valor adquisición", key: "VALOR_ADQUISICION", width: 17, tipo: "moneda" },
      { header: "Valor actual", key: "VALOR_ACTUAL", width: 15, tipo: "moneda" },
      { header: "Estado", key: "ESTADO", width: 16 },
    ],
    resumen: (f) => [
      `Valor de adquisición: ${moneda(suma(f, "VALOR_ADQUISICION"))}   |   Valor actual: ${moneda(suma(f, "VALOR_ACTUAL"))}`,
    ],
  },
};

// GET /api/reportes/:tipo?formato=pdf|xlsx
router.get("/:tipo", async (req, res, next) => {
  let conn;
  try {
    const def = REPORTES[req.params.tipo];
    if (!def) {
      return res.status(404).json({ error: `Reporte desconocido. Opciones: ${Object.keys(REPORTES).join(", ")}` });
    }
    const formato = req.query.formato === "pdf" ? "pdf" : "xlsx";

    conn = await getConnection();
    const { rows } = await conn.execute(def.sql);

    const datos = {
      titulo: def.titulo,
      subtitulo: `Generado el ${new Date().toLocaleString("es-GT")} por ${req.user.nombre} (${req.user.rol})`,
      resumen: def.resumen(rows),
      columnas: def.columnas,
      filas: rows,
    };

    const buffer = formato === "pdf" ? await generarPDF(datos) : await generarExcel(datos);

    registrarBitacora({
      usuario: req.user,
      accion: "EXPORTAR",
      entidad: `reportes/${req.params.tipo}`,
      detalle: `Formato ${formato.toUpperCase()} (${rows.length} registros)`,
    });

    res.setHeader(
      "Content-Type",
      formato === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="reporte-${req.params.tipo}.${formato}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
