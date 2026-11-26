import { useState } from "react";
import { FileText, FileSpreadsheet, Package, Wallet, Users, Boxes, Download } from "lucide-react";
import { descargar } from "../api.js";

const REPORTES = [
  { tipo: "inventario", titulo: "Inventario por sucursal", icono: Package,
    descripcion: "Existencias de cada medicamento, stock mínimo y estado (OK o bajo stock)." },
  { tipo: "efectivo", titulo: "Flujo de efectivo", icono: Wallet,
    descripcion: "Ingresos y egresos de todas las sucursales, con totales y flujo neto para auditoría." },
  { tipo: "planilla", titulo: "Gastos de planilla", icono: Users,
    descripcion: "Salarios, bonificaciones y descuentos por empleado y por periodo." },
  { tipo: "activos", titulo: "Activos fijos", icono: Boxes,
    descripcion: "Listado de activos con su valor de adquisición, valor actual y estado." },
];

export default function Reportes() {
  const [cargando, setCargando] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const exportar = async (tipo, formato) => {
    const clave = `${tipo}-${formato}`;
    setCargando(clave);
    setError("");
    setExito("");
    try {
      const fecha = new Date().toISOString().slice(0, 10);
      await descargar(`/reportes/${tipo}?formato=${formato}`, `reporte-${tipo}-${fecha}.${formato}`);
      setExito(`Reporte de ${tipo} descargado en ${formato === "pdf" ? "PDF" : "Excel"}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando("");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="icon-chip"><FileText size={20} /></div>
        <h2>Reportes de auditoría</h2>
      </div>
      <div className="mensaje-info">
        <Download size={17} /> Cada descarga queda registrada en la bitácora con el usuario que la realizó.
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      <div className="report-grid">
        {REPORTES.map((r) => {
          const Icono = r.icono;
          return (
            <div className="card c-indigo report-card" key={r.tipo}>
              <div className="icon-wrap"><Icono size={19} /></div>
              <h3>{r.titulo}</h3>
              <p>{r.descripcion}</p>
              <div className="acciones">
                <button className="btn" type="button" disabled={!!cargando} onClick={() => exportar(r.tipo, "pdf")}>
                  <FileText size={16} /> {cargando === `${r.tipo}-pdf` ? "Generando..." : "PDF"}
                </button>
                <button className="btn btn-secundario" type="button" disabled={!!cargando} onClick={() => exportar(r.tipo, "xlsx")}>
                  <FileSpreadsheet size={16} /> {cargando === `${r.tipo}-xlsx` ? "Generando..." : "Excel"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
