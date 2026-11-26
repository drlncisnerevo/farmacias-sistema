import { useEffect, useState } from "react";
import { api } from "../api.js";
import { ArrowLeftRight, PlusCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import Buscador, { filtrarFilas } from "../components/Buscador.jsx";

export default function Traslados() {
  const { puedeEscribir } = useAuth();
  const [texto, setTexto] = useState("");
  const [traslados, setTraslados] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [form, setForm] = useState({
    medicamento_id: "",
    sucursal_origen_id: "",
    sucursal_destino_id: "",
    cantidad: "",
    responsable: "",
    motivo: "",
  });

  const cargar = () => {
    api.get("/traslados").then(setTraslados).catch((e) => setError(e.message));
    api.get("/sucursales").then(setSucursales).catch(() => {});
    api.get("/medicamentos").then(setMedicamentos).catch(() => {});
  };

  useEffect(cargar, []);

  const cambiar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    try {
      await api.post("/traslados", form);
      setExito("Traslado registrado. El inventario de ambas sucursales ya quedó actualizado.");
      setForm({
        medicamento_id: "",
        sucursal_origen_id: "",
        sucursal_destino_id: "",
        cantidad: "",
        responsable: "",
        motivo: "",
      });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="icon-chip"><ArrowLeftRight size={20} /></div>
        <h2>Traslados de medicamentos entre sucursales</h2>
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      {puedeEscribir && (
      <form className="form-panel" onSubmit={enviar}>
        <div className="form-panel-title"><PlusCircle size={16} /> Registrar traslado</div>
        <div className="form-row">
          <label>Medicamento</label>
          <select value={form.medicamento_id} onChange={cambiar("medicamento_id")} required>
            <option value="">Selecciona un medicamento</option>
            {medicamentos.map((m) => (
              <option key={m.ID} value={m.ID}>{m.NOMBRE}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Sucursal de origen</label>
          <select value={form.sucursal_origen_id} onChange={cambiar("sucursal_origen_id")} required>
            <option value="">Selecciona la sucursal de origen</option>
            {sucursales.map((s) => (
              <option key={s.ID} value={s.ID}>{s.NOMBRE}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Sucursal de destino</label>
          <select value={form.sucursal_destino_id} onChange={cambiar("sucursal_destino_id")} required>
            <option value="">Selecciona la sucursal de destino</option>
            {sucursales.map((s) => (
              <option key={s.ID} value={s.ID}>{s.NOMBRE}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Cantidad</label>
          <input type="number" min="1" value={form.cantidad} onChange={cambiar("cantidad")} required />
        </div>
        <div className="form-row">
          <label>Responsable</label>
          <input value={form.responsable} onChange={cambiar("responsable")} required />
        </div>
        <div className="form-row">
          <label>Motivo</label>
          <input value={form.motivo} onChange={cambiar("motivo")} placeholder="Reabastecimiento por baja existencia..." />
        </div>
        <button className="btn" type="submit">Registrar traslado</button>
      </form>
      )}

      <Buscador valor={texto} onChange={setTexto} placeholder="Buscar medicamento, sucursal, responsable..." total={traslados.length} mostrados={filtrarFilas(traslados, texto).length} />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Medicamento</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Cantidad</th>
              <th>Responsable</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtrarFilas(traslados, texto).map((t) => (
              <tr key={t.ID}>
                <td>{t.MEDICAMENTO}</td>
                <td>{t.SUCURSAL_ORIGEN}</td>
                <td>{t.SUCURSAL_DESTINO}</td>
                <td>{t.CANTIDAD}</td>
                <td>{t.RESPONSABLE}</td>
                <td>{new Date(t.FECHA).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
