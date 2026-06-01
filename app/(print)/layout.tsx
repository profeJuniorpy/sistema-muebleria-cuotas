export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media print {
          @page { margin: 15mm; size: A4 portrait; }
          .no-print { display: none !important; }
          body { background: white !important; }
          table { width: 100%; border-collapse: collapse; break-inside: auto; }
          thead { display: table-header-group; }
          tr { break-inside: avoid; page-break-inside: avoid; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 11px; }
          th { background-color: #f3f4f6 !important; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
        }
        @media screen {
          body { background: #e5e7eb; }
          .print-container {
            max-width: 960px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
            padding: 40px 48px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          }
        }
      `}</style>
      <div className="print-container">
        {children}
      </div>
    </>
  );
}
