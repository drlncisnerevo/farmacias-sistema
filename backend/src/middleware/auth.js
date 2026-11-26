require("dotenv").config();
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "clave-de-desarrollo-cambiala-en-el-env";
if (!process.env.JWT_SECRET) {
  console.warn("AVISO: JWT_SECRET no esta definido en .env; se usa una clave de desarrollo.");
}

function firmarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      sucursal_id: usuario.sucursal_id ?? null,
    },
    SECRET,
    { expiresIn: "8h" }
  );
}

// Exige un token valido en el encabezado "Authorization: Bearer <token>"
function requireAuth(req, res, next) {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "Debes iniciar sesion para continuar" });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Tu sesion vencio o es invalida. Inicia sesion de nuevo." });
  }
}

// Reglas de permisos por rol (se aplican a TODAS las rutas protegidas):
//  - AUDITOR: solo lectura (GET).
//  - GERENTE: lectura y escritura (POST/PUT), pero no puede eliminar ni tocar sucursales.
//  - ADMIN: acceso total.
function aplicarPermisos(req, res, next) {
  if (req.method === "GET") return next();

  const { rol } = req.user;
  if (rol === "AUDITOR") {
    return res.status(403).json({ error: "El perfil Auditor es de solo lectura." });
  }
  if (req.method === "DELETE" && rol !== "ADMIN") {
    return res.status(403).json({ error: "Solo el Administrador central puede eliminar registros." });
  }
  if (req.path.startsWith("/sucursales") && rol !== "ADMIN") {
    return res.status(403).json({ error: "Solo el Administrador central puede modificar sucursales." });
  }
  next();
}

// Restringe una ruta a ciertos roles
function soloRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: "No tienes permiso para ver este recurso." });
    }
    next();
  };
}

module.exports = { firmarToken, requireAuth, aplicarPermisos, soloRoles };
