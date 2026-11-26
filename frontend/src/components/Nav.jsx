import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, MapPin, Package, Boxes, Wallet, ArrowLeftRight, Truck, Pill,
  FileText, ScrollText, LogOut, Sun, Moon,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";

const principal = [
  { to: "/", texto: "Panel general", icono: LayoutDashboard, fin: true },
  { to: "/mapa", texto: "Mapa de sucursales", icono: MapPin },
];
const operacion = [
  { to: "/inventario", texto: "Inventario", icono: Package },
  { to: "/activos-fijos", texto: "Activos fijos", icono: Boxes },
  { to: "/movimientos", texto: "Flujo de efectivo", icono: Wallet },
  { to: "/traslados", texto: "Traslados", icono: ArrowLeftRight },
  { to: "/pedidos", texto: "Pedidos y entregas", icono: Truck },
];

const ROLES = { ADMIN: "Administrador", GERENTE: "Gerente", AUDITOR: "Auditor" };

export function alternarTema() {
  const nuevo = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nuevo;
  localStorage.setItem("farmacias_tema", nuevo);
  return nuevo;
}

export default function Nav() {
  const { usuario, logout, puedeVerBitacora } = useAuth();
  const [tema, setTema] = useState(document.documentElement.dataset.theme || "light");

  const renderLink = (e) => {
    const Icono = e.icono;
    return (
      <NavLink key={e.to} to={e.to} end={e.fin} className={({ isActive }) => (isActive ? "active" : "")}>
        <Icono size={18} strokeWidth={2} />
        {e.texto}
      </NavLink>
    );
  };

  const inicial = usuario ? usuario.nombre.trim().charAt(0).toUpperCase() : "?";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo-badge"><Pill size={20} color="#1e1b4b" strokeWidth={2.5} /></div>
        <div>
          <h1>Sistema de Farmacias</h1>
          <span>Gestión y auditoría</span>
        </div>
      </div>

      <nav>
        {principal.map(renderLink)}
        <div className="nav-label">Operación</div>
        {operacion.map(renderLink)}
        <div className="nav-label">Auditoría</div>
        {renderLink({ to: "/reportes", texto: "Reportes", icono: FileText })}
        {puedeVerBitacora && renderLink({ to: "/bitacora", texto: "Bitácora", icono: ScrollText })}
      </nav>

      <div className="user-card">
        <div className="user-top">
          <div className="avatar">{inicial}</div>
          <div>
            <div className="user-name">{usuario?.nombre}</div>
            <span className="user-rol">{ROLES[usuario?.rol] || usuario?.rol}</span>
          </div>
        </div>
        <div className="user-actions">
          <button type="button" onClick={() => setTema(alternarTema())} title="Cambiar entre modo claro y oscuro">
            {tema === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {tema === "dark" ? "Claro" : "Oscuro"}
          </button>
          <button type="button" onClick={logout} title="Cerrar sesión">
            <LogOut size={15} /> Salir
          </button>
        </div>
      </div>
    </aside>
  );
}
