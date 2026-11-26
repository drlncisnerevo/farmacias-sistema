import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Boxes, PlusCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import Buscador, { filtrarFilas } from "../components/Buscador.jsx";

export default function ActivosFijos() {
  const { puedeEscribir } = useAuth();
  const [texto, setTexto] = useState("");
  const [activos, setActivos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [form, setForm] = useState({
    sucursal_id: "",
    descripcion: "",
    categoria: "",
    valor_adquisicion: "",
    fecha_adquisicion: "",
  });

  const cargar = () => {
    api.get("/activos-fijos").then(setActivos).catch((e) => setError(e.message));
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
      await api.post("/activos-fijos", form);
      setExito("Activo fijo registrado correctamente.");
      setForm({
        sucursal_id: "",
        descripcion: "",
        categoria: "",
        valor_adquisicion: "",
        fecha_adquisicion: "",
      });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="icon-chip"><Boxes size={20} /></div>
        <h2>Activos fijos</h2>
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      {puedeEscribir && (
      <form className="form-panel" onSubmit={enviar}>
        <div className="form-panel-title"><PlusCircle size={16} /> Registrar nuevo activo</div>
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
          <label>Descripción</label>
          <input value={form.descripcion} onChange={cambiar("descripcion")} required />
        </div>
        <div className="form-row">
          <label>Categoría</label>
          <input value={form.categoria} onChange={cambiar("categoria")} placeholder="Mobiliario, equipo, etc." />
        </div>
        <div className="form-row">
          <label>Valor de adquisición (Q)</label>
          <input type="number" step="0.01" value={form.valor_adquisicion} onChange={cambiar("valor_adquisicion")} required />
        </div>
        <div className="form-row">
          <label>Fecha de adquisición</label>
          <input type="date" value={form.fecha_adquisicion} onChange={cambiar("fecha_adquisicion")} required />
        </div>
        <button className="btn" type="submit">Registrar activo</button>
      </form>
      )}

      <Buscador valor={texto} onChange={setTexto} placeholder="Buscar activo, categoría o sucursal..." total={activos.length} mostrados={filtrarFilas(activos, texto).length} />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sucursal</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Valor adquisición</th>
              <th>Valor actual</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrarFilas(activos, texto).map((a) => (
              <tr key={a.ID}>
                <td>{a.SUCURSAL}</td>
                <td>{a.DESCRIPCION}</td>
                <td>{a.CATEGORIA}</td>
                <td>Q{Number(a.VALOR_ADQUISICION).toFixed(2)}</td>
                <td>Q{Number(a.VALOR_ACTUAL).toFixed(2)}</td>
                <td>{a.ESTADO}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
