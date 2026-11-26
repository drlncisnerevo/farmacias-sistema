import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import "leaflet/dist/leaflet.css";
import "./index.css";

// Tema (claro/oscuro): se recuerda la preferencia; si no hay, se usa la del sistema
const guardado = localStorage.getItem("farmacias_tema");
const prefiereOscuro = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.dataset.theme = guardado || (prefiereOscuro ? "dark" : "light");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
