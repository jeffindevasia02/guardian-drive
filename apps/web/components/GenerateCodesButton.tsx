"use client";

import { useState } from "react";

export default function GenerateCodesButton({ tripId }: { tripId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/generate-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip_id: tripId }),
      });
      const json = await r.json();
      if (!r.ok) {
        setResult(json?.error ?? "Failed");
      } else {
        setResult(`OK (rows: ${json?.count ?? "?"})`);
      }
    } catch (e: any) {
      setResult(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button onClick={onClick} disabled={loading} style={{ padding: "4px 8px" }}>
        {loading ? "Generating…" : "Generate Codes"}
      </button>
      {result && <small>{result}</small>}
    </div>
  );
}
