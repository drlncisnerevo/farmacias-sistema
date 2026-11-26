import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import Nav from "./components/Nav.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Mapa from "./pages/Mapa.jsx";
import Inventario from "./pages/Inventario.jsx";
import ActivosFijos from "./pages/ActivosFijos.jsx";
import MovimientosEfectivo from "./pages/MovimientosEfectivo.jsx";
import Traslados from "./pages/Traslados.jsx";
import Pedidos from "./pages/Pedidos.jsx";
import Reportes from "./pages/Reportes.jsx";
import Bitacora from "./pages/Bitacora.jsx";

export default function App() {
  const { usuario, puedeVerBitacora } = useAuth();

  // Sin sesion iniciada solo se muestra el login
  if (!usuario) return <Login />;

  return (
    <div className="layout">
      <Nav />
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/activos-fijos" element={<ActivosFijos />} />
          <Route path="/movimientos" element={<MovimientosEfectivo />} />
          <Route path="/traslados" element={<Traslados />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/bitacora" element={puedeVerBitacora ? <Bitacora /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
