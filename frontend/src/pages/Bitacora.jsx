import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { api } from "../api.js";
import Buscador, { filtrarFilas } from "../components/Buscador.jsx";

const ACCIONES = ["TODAS", "LOGIN", "CREAR", "ACTUALIZAR", "ELIMINAR", "EXPORTAR"];

export default function Bitacora() {
  const [registros, setRegistros] = useState([]);
  const [texto, setTexto] = useState("");
  const [accion, setAccion] = useState("TODAS");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/bitacora?limit=300").then(setRegistros).catch((e) => setError(e.message));
  }, []);

  const visibles = filtrarFilas(
    registros.filter((r) => accion === "TODAS" || r.ACCION === accion),
    texto
  );

  return (
    <div>
      <div className="page-header">
        <div className="icon-chip"><ScrollText size={20} /></div>
        <h2>Bitácora de auditoría</h2>
      </div>
      {error && <div className="mensaje-error">{error}</div>}

      <Buscador valor={texto} onChange={setTexto} placeholder="Buscar por usuario, entidad o detalle..." total={registros.length} mostrados={visibles.length}>
        <select value={accion} onChange={(e) => setAccion(e.target.value)}>
          {ACCIONES.map((a) => <option key={a} value={a}>{a === "TODAS" ? "Todas las acciones" : a}</option>)}
        </select>
      </Buscador>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.ID}>
                <td className="mono">{new Date(r.FECHA).toLocaleString()}</td>
                <td>{r.USUARIO_NOMBRE}</td>
                <td>{r.ROL && <span className={`badge ${r.ROL}`}>{r.ROL}</span>}</td>
                <td><span className={`badge ${r.ACCION}`}>{r.ACCION}</span></td>
                <td>{r.ENTIDAD}</td>
                <td style={{ maxWidth: 320, wordBreak: "break-word", color: "var(--muted)", fontSize: 12.5 }}>{r.DETALLE}</td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr><td className="sin-resultados" colSpan={6}>No hay registros que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
