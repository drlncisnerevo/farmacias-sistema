import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { api } from "../api.js";
import { MapPin } from "lucide-react";

// Los iconos por defecto de Leaflet no cargan bien con los empaquetadores
// modernos (Vite/Webpack), asi que se definen explicitamente desde un CDN.
const iconoSucursal = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const CENTRO_GUATEMALA = [14.6349, -90.5069];

export default function Mapa() {
  const [sucursales, setSucursales] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [resumenEfectivo, setResumenEfectivo] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/sucursales"),
      api.get("/inventario"),
      api.get("/movimientos-efectivo/resumen"),
    ])
      .then(([s, i, r]) => {
        setSucursales(s);
        setInventario(i);
        setResumenEfectivo(r);
      })
      .catch((e) => setError(e.message));
  }, []);

  const conUbicacion = useMemo(
    () => sucursales.filter((s) => s.LATITUD != null && s.LONGITUD != null),
    [sucursales]
  );

  const resumenPorSucursal = (sucursal) => {
    const items = inventario.filter((i) => i.SUCURSAL === sucursal.NOMBRE);
    const bajoStock = items.filter((i) => i.CANTIDAD_DISPONIBLE < i.STOCK_MINIMO).length;
    const flujo = resumenEfectivo.find((r) => r.SUCURSAL === sucursal.NOMBRE);
    return {
      totalMedicamentos: items.length,
      bajoStock,
      flujoNeto: flujo ? Number(flujo.FLUJO_NETO).toFixed(2) : "0.00",
    };
  };

  return (
    <div>
      <div className="page-header">
        <div className="icon-chip"><MapPin size={20} /></div>
        <h2>Mapa de sucursales</h2>
      </div>
      {error && <div className="mensaje-error">{error}</div>}

      {conUbicacion.length === 0 ? (
        <div className="empty-state">
          Ninguna sucursal tiene coordenadas registradas todavía. Ejecuta el
          script <code>agregar_coordenadas.sql</code> o agrega latitud y
          longitud al crear/editar una sucursal.
        </div>
      ) : (
        <div className="chart-panel" style={{ padding: 0, overflow: "hidden" }}>
          <MapContainer
            center={CENTRO_GUATEMALA}
            zoom={8}
            scrollWheelZoom={true}
            style={{ height: 460, width: "100%", borderRadius: "16px" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {conUbicacion.map((s) => {
              const r = resumenPorSucursal(s);
              return (
                <Marker key={s.ID} position={[s.LATITUD, s.LONGITUD]} icon={iconoSucursal}>
                  <Popup>
                    <strong>{s.NOMBRE}</strong>
                    <br />
                    {s.DEPARTAMENTO} — {s.TIPO === "CENTRO_COMERCIAL" ? "Centro comercial" : "Gasolinera"}
                    <br />
                    <br />
                    Medicamentos en inventario: <strong>{r.totalMedicamentos}</strong>
                    <br />
                    Bajo stock mínimo: <strong>{r.bajoStock}</strong>
                    <br />
                    Flujo de efectivo neto: <strong>Q{r.flujoNeto}</strong>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      <div className="section-title">Sucursales registradas</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sucursal</th>
              <th>Tipo</th>
              <th>Departamento</th>
              <th>Coordenadas</th>
            </tr>
          </thead>
          <tbody>
            {sucursales.map((s) => (
              <tr key={s.ID}>
                <td>{s.NOMBRE}</td>
                <td>{s.TIPO === "CENTRO_COMERCIAL" ? "Centro comercial" : "Gasolinera"}</td>
                <td>{s.DEPARTAMENTO}</td>
                <td>
                  {s.LATITUD != null ? `${s.LATITUD}, ${s.LONGITUD}` : "Sin registrar"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
