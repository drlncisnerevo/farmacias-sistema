import { useEffect, useState } from "react";
import { api } from "../api.js";
import { LayoutDashboard, Building2, AlertTriangle, Wallet } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, Legend,
} from "recharts";

const tooltipStyle = {
  borderRadius: 10, border: "1px solid var(--border)", fontSize: 13,
  background: "var(--panel)", color: "var(--ink)",
};

export default function Dashboard() {
  const [sucursales, setSucursales] = useState([]);
  const [bajoStock, setBajoStock] = useState([]);
  const [resumenEfectivo, setResumenEfectivo] = useState([]);
  const [tendencia, setTendencia] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/sucursales"),
      api.get("/inventario/bajo-stock"),
      api.get("/movimientos-efectivo/resumen"),
    ])
      .then(([s, b, r]) => { setSucursales(s); setBajoStock(b); setResumenEfectivo(r); })
      .catch((e) => setError(e.message));
    api.get("/movimientos-efectivo/tendencia?dias=30").then(setTendencia).catch(() => {});
  }, []);

  const flujoTotal = resumenEfectivo.reduce((acc, r) => acc + Number(r.FLUJO_NETO || 0), 0);
  const datosGrafica = resumenEfectivo.map((r) => ({ sucursal: r.SUCURSAL, flujo: Number(r.FLUJO_NETO || 0) }));
  const datosTendencia = tendencia.map((t) => ({
    dia: t.DIA.slice(5).split("-").reverse().join("/"),
    Ingresos: Number(t.INGRESOS), Egresos: Number(t.EGRESOS),
  }));
  const colores = ["#4f46e5", "#06b6d4", "#7c3aed", "#16a34a", "#d97706"];

  return (
    <div>
      <div className="page-header">
        <div className="icon-chip"><LayoutDashboard size={20} /></div>
        <h2>Panel general</h2>
      </div>
      {error && <div className="mensaje-error">{error}</div>}

      <div className="card-grid">
        <div className="card c-indigo">
          <div className="icon-wrap"><Building2 size={19} /></div>
          <div className="valor">{sucursales.length}</div>
          <div className="etiqueta">Sucursales activas</div>
        </div>
        <div className="card c-amber">
          <div className="icon-wrap"><AlertTriangle size={19} /></div>
          <div className="valor">{bajoStock.length}</div>
          <div className="etiqueta">Medicamentos bajo el stock mínimo</div>
        </div>
        <div className="card c-green">
          <div className="icon-wrap"><Wallet size={19} /></div>
          <div className="valor">Q{flujoTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="etiqueta">Flujo de efectivo neto (todas las sucursales)</div>
        </div>
      </div>

      {datosTendencia.length > 0 && (
        <div className="chart-panel">
          <div className="section-title" style={{ margin: 0, marginBottom: 16 }}>Tendencia de efectivo · últimos 30 días</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={datosTendencia} margin={{ left: -6, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#9aa1bd" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9aa1bd" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `Q${Number(v).toFixed(2)}`} contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="Ingresos" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Egresos" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {datosGrafica.length > 0 && (
        <div className="chart-panel">
          <div className="section-title" style={{ margin: 0, marginBottom: 16 }}>Flujo de efectivo neto por sucursal</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={datosGrafica} margin={{ left: -6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="sucursal" tick={{ fontSize: 12, fill: "#9aa1bd" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9aa1bd" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`Q${Number(v).toFixed(2)}`, "Flujo neto"]} contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
              <Bar dataKey="flujo" radius={[8, 8, 0, 0]} maxBarSize={60}>
                {datosGrafica.map((_, i) => <Cell key={i} fill={colores[i % colores.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="section-title"><AlertTriangle size={16} color="#d97706" /> Alertas de inventario</div>
      {bajoStock.length === 0 ? (
        <div className="empty-state">No hay medicamentos por debajo del stock mínimo.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Sucursal</th><th>Medicamento</th><th>Disponible</th><th>Mínimo</th></tr></thead>
            <tbody>
              {bajoStock.map((b, i) => (
                <tr key={i} className="bajo-stock">
                  <td>{b.SUCURSAL}</td><td>{b.MEDICAMENTO}</td><td>{b.CANTIDAD_DISPONIBLE}</td><td>{b.STOCK_MINIMO}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
