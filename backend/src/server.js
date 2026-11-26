const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { initPool, closePool } = require("./db");
const { requireAuth, aplicarPermisos } = require("./middleware/auth");
const { bitacoraMiddleware } = require("./middleware/bitacora");

const authRoutes = require("./routes/auth.routes");
const sucursalesRoutes = require("./routes/sucursales.routes");
const medicamentosRoutes = require("./routes/medicamentos.routes");
const inventarioRoutes = require("./routes/inventario.routes");
const activosFijosRoutes = require("./routes/activosFijos.routes");
const empleadosRoutes = require("./routes/empleados.routes");
const planillaRoutes = require("./routes/planilla.routes");
const movimientosRoutes = require("./routes/movimientos.routes");
const trasladosRoutes = require("./routes/traslados.routes");
const clientesRoutes = require("./routes/clientes.routes");
const pedidosRoutes = require("./routes/pedidos.routes");
const reportesRoutes = require("./routes/reportes.routes");
const bitacoraRoutes = require("./routes/bitacora.routes");

const app = express();
app.use(cors());
app.use(express.json());

// ---- Rutas publicas ----
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mensaje: "API de farmacias funcionando" });
});
app.use("/api/auth", authRoutes);

// ---- Todo lo que sigue exige iniciar sesion, respeta los permisos por rol
//      y deja constancia en la bitacora de auditoria ----
app.use("/api", requireAuth, aplicarPermisos, bitacoraMiddleware);

app.use("/api/sucursales", sucursalesRoutes);
app.use("/api/medicamentos", medicamentosRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/activos-fijos", activosFijosRoutes);
app.use("/api/empleados", empleadosRoutes);
app.use("/api/planilla", planillaRoutes);
app.use("/api/movimientos-efectivo", movimientosRoutes);
app.use("/api/traslados", trasladosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/bitacora", bitacoraRoutes);

// Manejador de errores centralizado
app.use((err, req, res, next) => {
  console.error("Error en la API:", err.message);
  res.status(500).json({ error: err.message || "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000;

// Solo arranca el servidor si se ejecuta directamente (permite probar la app sin levantarlo)
if (require.main === module) {
  initPool()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`API escuchando en http://localhost:${PORT}`);
        console.log(`Prueba de salud: http://localhost:${PORT}/api/health`);
      });
    })
    .catch((err) => {
      console.error("No se pudo conectar a Oracle XE:", err.message);
      process.exit(1);
    });

  process.on("SIGINT", async () => {
    console.log("\nCerrando conexiones...");
    await closePool();
    process.exit(0);
  });
}

module.exports = app;
