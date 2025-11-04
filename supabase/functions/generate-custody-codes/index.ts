import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { trip_id, expiry_minutes = 120 } = await req.json().catch(() => ({}));
  if (!trip_id) return new Response(JSON.stringify({ error: "trip_id required" }), { status: 400 });

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, service);

  const { data: bookings, error } = await sb.from("booking").select("booking_id").eq("trip_id", trip_id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  const expiresAt = new Date(Date.now() + expiry_minutes * 60_000).toISOString();

  const rows = (bookings ?? []).flatMap(b => ([
    { booking_id: b.booking_id, event: "PICKUP", code: Math.floor(100000 + Math.random()*900000).toString(), expires_at: expiresAt },
    { booking_id: b.booking_id, event: "DROP",   code: Math.floor(100000 + Math.random()*900000).toString(), expires_at: expiresAt }
  ]));

  const { error: upErr } = await sb.from("custody_code").upsert(rows, { onConflict: "booking_id,event" });
  if (upErr) return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true, count: rows.length }), { status: 200 });
});
