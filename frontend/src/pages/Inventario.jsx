import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Package } from "lucide-react";
import Buscador, { filtrarFilas } from "../components/Buscador.jsx";

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [error, setError] = useState("");
  const [texto, setTexto] = useState("");
  const [sucursal, setSucursal] = useState("");
  const [soloBajo, setSoloBajo] = useState(false);

  useEffect(() => {
    api.get("/inventario").then(setInventario).catch((e) => setError(e.message));
  }, []);

  const sucursales = [...new Set(inventario.map((i) => i.SUCURSAL))];
  const visibles = filtrarFilas(
    inventario.filter(
      (i) => (!sucursal || i.SUCURSAL === sucursal) && (!soloBajo || i.CANTIDAD_DISPONIBLE < i.STOCK_MINIMO)
    ),
    texto
  );

  return (
    <div>
      <div className="page-header">
        <div className="icon-chip"><Package size={20} /></div>
        <h2>Inventario por sucursal</h2>
      </div>
      {error && <div className="mensaje-error">{error}</div>}

      <Buscador valor={texto} onChange={setTexto} placeholder="Buscar medicamento o sucursal..." total={inventario.length} mostrados={visibles.length}>
        <select value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
          <option value="">Todas las sucursales</option>
          {sucursales.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" className={`chip ${soloBajo ? "activo" : ""}`} onClick={() => setSoloBajo(!soloBajo)}>
          Solo bajo stock
        </button>
      </Buscador>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Sucursal</th><th>Medicamento</th><th>Cantidad disponible</th><th>Stock mínimo</th><th>Última actualización</th></tr>
          </thead>
          <tbody>
            {visibles.map((item) => (
              <tr key={item.ID} className={item.CANTIDAD_DISPONIBLE < item.STOCK_MINIMO ? "bajo-stock" : ""}>
                <td>{item.SUCURSAL}</td>
                <td>{item.MEDICAMENTO}</td>
                <td>{item.CANTIDAD_DISPONIBLE}</td>
                <td>{item.STOCK_MINIMO}</td>
                <td className="mono">{new Date(item.FECHA_ACTUALIZACION).toLocaleString()}</td>
              </tr>
            ))}
            {visibles.length === 0 && <tr><td className="sin-resultados" colSpan={5}>No hay registros que coincidan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
