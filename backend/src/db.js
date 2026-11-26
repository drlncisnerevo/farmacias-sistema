const oracledb = require("oracledb");
require("dotenv").config();

// Trabajamos con transacciones explicitas (commit/rollback manual en cada ruta)
oracledb.autoCommit = false;
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool;

async function initPool() {
  pool = await oracledb.createPool({
    user: process.env.DB_USER || "system",
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING || "localhost:1521/XEPDB1",
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  });
  console.log("Pool de conexiones a Oracle XE creado correctamente");
}

async function getConnection() {
  if (!pool) {
    throw new Error("El pool de conexiones no ha sido inicializado todavia");
  }
  return pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close(0);
  }
}

module.exports = { initPool, getConnection, closePool };
