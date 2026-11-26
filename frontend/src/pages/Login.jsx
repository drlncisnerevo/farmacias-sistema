import { useState } from "react";
import { Pill, Mail, Lock, BarChart3, MapPin, FileText, ShieldCheck, LogIn, Sun, Moon } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { alternarTema } from "../components/Nav.jsx";

const DEMO = [
  { quien: "Administrador central", que: "Acceso total", email: "admin@farmacias.gt", clave: "admin123" },
  { quien: "Gerente de sucursal", que: "Opera, no elimina", email: "gerente@farmacias.gt", clave: "gerente123" },
  { quien: "Auditor", que: "Solo lectura", email: "auditor@farmacias.gt", clave: "auditor123" },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [tema, setTema] = useState(document.documentElement.dataset.theme || "light");

  const entrar = async (correo, clave) => {
    setError("");
    setCargando(true);
    try {
      await login(correo, clave);
    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-theme">
        <button type="button" onClick={() => setTema(alternarTema())} title="Cambiar tema">
          {tema === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      <section className="login-hero">
        <div className="logo-badge"><Pill size={28} color="#1e1b4b" strokeWidth={2.5} /></div>
        <h1>Control total de tu cadena de farmacias</h1>
        <p className="lead">
          Inventario, efectivo, activos y entregas de todas las sucursales en un solo lugar, con auditoría en tiempo real.
        </p>
        <ul>
          <li><span className="ico"><BarChart3 size={18} /></span> Panel con indicadores y tendencias de efectivo</li>
          <li><span className="ico"><MapPin size={18} /></span> Mapa de sucursales por todo el país</li>
          <li><span className="ico"><FileText size={18} /></span> Reportes de auditoría en PDF y Excel</li>
          <li><span className="ico"><ShieldCheck size={18} /></span> Roles, permisos y bitácora de cada acción</li>
        </ul>
      </section>

      <section className="login-form-side">
        <div className="login-box">
          <h2>Iniciar sesión</h2>
          <p className="sub">Ingresa con tu cuenta para continuar.</p>

          {error && <div className="mensaje-error">{error}</div>}

          <form onSubmit={(e) => { e.preventDefault(); entrar(email, password); }}>
            <div className="form-row">
              <label>Correo electrónico</label>
              <div className="input-icon">
                <Mail size={16} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@farmacias.gt" required autoFocus />
              </div>
            </div>
            <div className="form-row">
              <label>Contraseña</label>
              <div className="input-icon">
                <Lock size={16} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            </div>
            <button className="btn" type="submit" disabled={cargando}>
              <LogIn size={16} /> {cargando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="demo-box">
            <div className="demo-title">Cuentas de demostración</div>
            <div className="demo-btns">
              {DEMO.map((d) => (
                <button key={d.email} type="button" className="demo-btn" disabled={cargando} onClick={() => entrar(d.email, d.clave)}>
                  <span>
                    <div className="quien">{d.quien}</div>
                    <div className="que">{d.email}</div>
                  </span>
                  <span className="que">{d.que}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
