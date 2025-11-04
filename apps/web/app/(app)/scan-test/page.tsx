"use client";
import { useState } from "react";

export default function ScanTest() {
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [event, setEvent] = useState<"PICKUP"|"DROP">("PICKUP");
  const [resp, setResp] = useState<any>(null);

  async function run() {
    const r = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_secret: qr, custody_code: code, event })
    });
    setResp(await r.json());
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Scan Test</h1>
      <input placeholder="qr_secret (uuid)" value={qr} onChange={e=>setQr(e.target.value)} />
      <input placeholder="custody_code (6 digits)" value={code} onChange={e=>setCode(e.target.value)} />
      <select value={event} onChange={e=>setEvent(e.target.value as any)}>
        <option value="PICKUP">PICKUP</option>
        <option value="DROP">DROP</option>
      </select>
      <button onClick={run}>Scan</button>
      <pre>{resp ? JSON.stringify(resp,null,2) : null}</pre>
    </main>
  );
}
