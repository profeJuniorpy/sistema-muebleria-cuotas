"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-red-50">
      <div className="max-w-lg w-full bg-white rounded-xl border border-red-200 shadow p-6 space-y-4">
        <h2 className="text-lg font-bold text-red-700">Error en el dashboard</h2>
        <p className="text-sm text-red-600 font-mono bg-red-50 p-3 rounded break-all">
          {error.message || "Error desconocido"}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
