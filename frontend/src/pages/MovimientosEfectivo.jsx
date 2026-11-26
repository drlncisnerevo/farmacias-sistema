import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Wallet, PlusCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import Buscador, { filtrarFilas } from "../components/Buscador.jsx";

export default function MovimientosEfectivo() {
  const { puedeEscribir } = useAuth();
  const [texto, setTexto] = useState("");
  const [fSucursal, setFSucursal] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [form, setForm] = useState({
    sucursal_id: "",
    tipo: "INGRESO",
    monto: "",
    concepto: "",
  });

  const cargar = () => {
    api.get("/movimientos-efectivo").then(setMovimientos).catch((e) => setError(e.message));
    api.get("/movimientos-efectivo/resumen").then(setResumen).catch(() => {});
    api.get("/sucursales").then(setSucursales).catch(() => {});
  };

  useEffect(cargar, []);

  const cambiar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    try {
      await api.post("/movimientos-efectivo", form);
      setExito("Movimiento registrado correctamente.");
      setForm({ sucursal_id: "", tipo: "INGRESO", monto: "", concepto: "" });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const visibles = filtrarFilas(
    movimientos.filter((m) => (!fSucursal || m.SUCURSAL === fSucursal) && (!fTipo || m.TIPO === fTipo)),
    texto
  );

  return (
    <div>
      <div className="page-header">
        <div className="icon-chip"><Wallet size={20} /></div>
        <h2>Flujo de efectivo (auditoría)</h2>
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      <div className="section-title">Resumen por sucursal</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sucursal</th>
              <th>Ingresos</th>
              <th>Egresos</th>
              <th>Flujo neto</th>
            </tr>
          </thead>
          <tbody>
            {resumen.map((r, i) => (
              <tr key={i}>
                <td>{r.SUCURSAL}</td>
                <td>Q{Number(r.TOTAL_INGRESOS).toFixed(2)}</td>
                <td>Q{Number(r.TOTAL_EGRESOS).toFixed(2)}</td>
                <td>Q{Number(r.FLUJO_NETO).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {puedeEscribir && (
      <form className="form-panel" onSubmit={enviar}>
        <div className="form-panel-title"><PlusCircle size={16} /> Registrar movimiento</div>
        <div className="form-row">
          <label>Sucursal</label>
          <select value={form.sucursal_id} onChange={cambiar("sucursal_id")} required>
            <option value="">Selecciona una sucursal</option>
            {sucursales.map((s) => (
              <option key={s.ID} value={s.ID}>{s.NOMBRE}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Tipo</label>
          <select value={form.tipo} onChange={cambiar("tipo")}>
            <option value="INGRESO">Ingreso</option>
            <option value="EGRESO">Egreso</option>
          </select>
        </div>
        <div className="form-row">
          <label>Monto (Q)</label>
          <input type="number" step="0.01" value={form.monto} onChange={cambiar("monto")} required />
        </div>
        <div className="form-row">
          <label>Concepto</label>
          <input value={form.concepto} onChange={cambiar("concepto")} placeholder="Venta del día, pago de proveedor..." />
        </div>
        <button className="btn" type="submit">Registrar movimiento</button>
      </form>
      )}

      <div className="section-title">Historial de movimientos</div>
      <Buscador valor={texto} onChange={setTexto} placeholder="Buscar concepto, sucursal..." total={movimientos.length} mostrados={visibles.length}>
        <select value={fSucursal} onChange={(e) => setFSucursal(e.target.value)}>
          <option value="">Todas las sucursales</option>
          {[...new Set(movimientos.map((m) => m.SUCURSAL))].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
          <option value="">Ingresos y egresos</option>
          <option value="INGRESO">Solo ingresos</option>
          <option value="EGRESO">Solo egresos</option>
        </select>
      </Buscador>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sucursal</th>
              <th>Tipo</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Concepto</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((m) => (
              <tr key={m.ID} className={m.TIPO === "INGRESO" ? "ingreso" : "egreso"}>
                <td>{m.SUCURSAL}</td>
                <td className="tipo">{m.TIPO}</td>
                <td>Q{Number(m.MONTO).toFixed(2)}</td>
                <td>{new Date(m.FECHA).toLocaleDateString()}</td>
                <td>{m.CONCEPTO}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
