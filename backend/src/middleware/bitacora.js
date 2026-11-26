const { registrarBitacora } = require("../bitacora");

const ACCIONES = { POST: "CREAR", PUT: "ACTUALIZAR", PATCH: "ACTUALIZAR", DELETE: "ELIMINAR" };

function resumirBody(body) {
  if (!body || typeof body !== "object") return "";
  const limpio = {};
  for (const [k, v] of Object.entries(body)) {
    if (/pass|clave|token/i.test(k)) continue; // nunca guardar secretos
    limpio[k] = v;
  }
  return JSON.stringify(limpio);
}

// Registra en BITACORA toda operacion que modifica datos y termino con exito.
function bitacoraMiddleware(req, res, next) {
  if (req.method === "GET") return next();

  // Se capturan los datos ahora, de forma sincrona, porque despues Express modifica req.url
  const usuario = req.user;
  const accion = ACCIONES[req.method] || req.method;
  const entidad = req.originalUrl.split("?")[0].replace(/^\/api\//, "");
  const detalle = resumirBody(req.body);

  res.on("finish", () => {
    if (res.statusCode < 400) {
      registrarBitacora({ usuario, accion, entidad, detalle });
    }
  });
  next();
}

module.exports = { bitacoraMiddleware };
