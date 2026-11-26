import { Search } from "lucide-react";

// Barra de busqueda + espacio para filtros adicionales (children) + contador de resultados
export default function Buscador({ valor, onChange, placeholder = "Buscar...", total, mostrados, children }) {
  return (
    <div className="toolbar">
      <div className="search-box">
        <Search size={16} />
        <input value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
      {children}
      {total !== undefined && (
        <span className="contador">
          {mostrados} de {total} registros
        </span>
      )}
    </div>
  );
}

// Filtra filas buscando el texto en cualquiera de sus valores
export function filtrarFilas(filas, texto) {
  const t = texto.trim().toLowerCase();
  if (!t) return filas;
  return filas.filter((f) =>
    Object.values(f).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(t))
  );
}
