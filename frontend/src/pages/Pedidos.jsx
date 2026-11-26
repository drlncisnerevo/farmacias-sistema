import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Truck, UserPlus, PackagePlus } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import Buscador, { filtrarFilas } from "../components/Buscador.jsx";

const ESTADOS = ["PENDIENTE", "EN_CAMINO", "ENTREGADO", "CANCELADO"];

export default function Pedidos() {
  const { puedeEscribir } = useAuth();
  const [texto, setTexto] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [form, setForm] = useState({
    cliente_id: "",
    sucursal_id: "",
    forma_pago: "EFECTIVO",
    tiempo_estimado_min: "",
  });
  const [detalles, setDetalles] = useState([
    { medicamento_id: "", cantidad: 1, precio_unitario: "" },
  ]);

  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", telefono: "", direccion_entrega: "" });

  const cargar = () => {
    api.get("/pedidos").then(setPedidos).catch((e) => setError(e.message));
    api.get("/clientes").then(setClientes).catch(() => {});
    api.get("/sucursales").then(setSucursales).catch(() => {});
    api.get("/medicamentos").then(setMedicamentos).catch(() => {});
  };

  useEffect(cargar, []);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const cambiarDetalle = (i, campo) => (e) => {
    const copia = [...detalles];
    copia[i][campo] = e.target.value;
    if (campo === "medicamento_id") {
      const med = medicamentos.find((m) => String(m.ID) === e.target.value);
      copia[i].precio_unitario = med ? med.PRECIO_UNITARIO : "";
    }
    setDetalles(copia);
  };

  const agregarLinea = () =>
    setDetalles([...detalles, { medicamento_id: "", cantidad: 1, precio_unitario: "" }]);

  const quitarLinea = (i) => setDetalles(detalles.filter((_, idx) => idx !== i));

  const crearCliente = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/clientes", nuevoCliente);
      setNuevoCliente({ nombre: "", telefono: "", direccion_entrega: "" });
      setExito("Cliente creado.");
      cargar();
      setForm((f) => ({ ...f, cliente_id: res.id }));
    } catch (err) {
      setError(err.message);
    }
  };

  const enviarPedido = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    try {
      await api.post("/pedidos", {
        ...form,
        detalles: detalles.map((d) => ({
          medicamento_id: d.medicamento_id,
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
        })),
      });
      setExito("Pedido creado correctamente.");
      setForm({ cliente_id: "", sucursal_id: "", forma_pago: "EFECTIVO", tiempo_estimado_min: "" });
      setDetalles([{ medicamento_id: "", cantidad: 1, precio_unitario: "" }]);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.put(`/pedidos/${id}/estado`, { estado });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const visibles = filtrarFilas(pedidos.filter((p) => !fEstado || p.ESTADO === fEstado), texto);

  return (
    <div>
      <div className="page-header">
        <div className="icon-chip"><Truck size={20} /></div>
        <h2>Pedidos y coordinación de entregas</h2>
      </div>
      {error && <div className="mensaje-error">{error}</div>}
      {exito && <div className="mensaje-exito">{exito}</div>}

      {puedeEscribir && (<>
      <form className="form-panel" onSubmit={crearCliente}>
        <div className="form-panel-title"><UserPlus size={16} /> Nuevo cliente</div>
        <div className="form-row"><label>Nombre</label>
          <input value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
        </div>
        <div className="form-row"><label>Teléfono</label>
          <input value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
        </div>
        <div className="form-row"><label>Dirección de entrega</label>
          <input value={nuevoCliente.direccion_entrega} onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion_entrega: e.target.value })} />
        </div>
        <button className="btn btn-secundario" type="submit">Guardar cliente</button>
      </form>

      <form className="form-panel" onSubmit={enviarPedido} style={{ maxWidth: 640 }}>
        <div className="form-panel-title"><PackagePlus size={16} /> Nuevo pedido</div>
        <div className="form-row">
          <label>Cliente</label>
          <select value={form.cliente_id} onChange={cambiar("cliente_id")} required>
            <option value="">Selecciona un cliente</option>
            {clientes.map((c) => (
              <option key={c.ID} value={c.ID}>{c.NOMBRE}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Sucursal que atiende el pedido</label>
          <select value={form.sucursal_id} onChange={cambiar("sucursal_id")} required>
            <option value="">Selecciona una sucursal</option>
            {sucursales.map((s) => (
              <option key={s.ID} value={s.ID}>{s.NOMBRE}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Forma de pago</label>
          <select value={form.forma_pago} onChange={cambiar("forma_pago")}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
          </select>
        </div>
        <div className="form-row">
          <label>Tiempo estimado de entrega (minutos)</label>
          <input type="number" value={form.tiempo_estimado_min} onChange={cambiar("tiempo_estimado_min")} />
        </div>

        <label style={{ fontSize: 12.5, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
          Medicamentos del pedido
        </label>
        <div style={{ marginTop: 8 }}>
          {detalles.map((d, i) => (
            <div className="linea-detalle" key={i}>
              <select value={d.medicamento_id} onChange={cambiarDetalle(i, "medicamento_id")} required>
                <option value="">Medicamento</option>
                {medicamentos.map((m) => (
                  <option key={m.ID} value={m.ID}>{m.NOMBRE}</option>
                ))}
              </select>
              <input type="number" min="1" style={{ width: 70 }} value={d.cantidad} onChange={cambiarDetalle(i, "cantidad")} required />
              <input type="number" step="0.01" style={{ width: 90 }} value={d.precio_unitario} onChange={cambiarDetalle(i, "precio_unitario")} required />
              {detalles.length > 1 && (
                <button type="button" className="btn btn-secundario" onClick={() => quitarLinea(i)}>Quitar</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-secundario" onClick={agregarLinea} style={{ marginBottom: 16 }}>
          + Agregar medicamento
        </button>
        <br />
        <button className="btn" type="submit">Crear pedido</button>
      </form>
      </>)}

      <Buscador valor={texto} onChange={setTexto} placeholder="Buscar cliente o sucursal..." total={pedidos.length} mostrados={visibles.length}>
        <select value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </Buscador>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Sucursal</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Cambiar estado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((p) => (
              <tr key={p.ID}>
                <td>{p.CLIENTE}</td>
                <td>{p.SUCURSAL}</td>
                <td>{new Date(p.FECHA_PEDIDO).toLocaleString()}</td>
                <td><span className={`badge ${p.ESTADO}`}>{p.ESTADO}</span></td>
                <td>
                  <select disabled={!puedeEscribir} value={p.ESTADO} onChange={(e) => cambiarEstado(p.ID, e.target.value)}>
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
