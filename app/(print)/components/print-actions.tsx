"use client";

import { Printer, X } from "lucide-react";

export function PrintActions() {
  return (
    <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
      <button
        onClick={() => window.print()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 16px",
          background: "#1a1a1a",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        <Printer size={14} /> Imprimir / PDF
      </button>
      <button
        onClick={() => window.close()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          background: "white",
          color: "#374151",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        <X size={14} /> Cerrar
      </button>
    </div>
  );
}
