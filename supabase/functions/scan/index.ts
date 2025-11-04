import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Payload = {
  qr_secret: string;
  event: "PICKUP" | "DROP";
  lat?: number;
  lng?: number;
  custody_code?: string;
};

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Authenticated driver JWT flows through from the app
  const sb = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  let body: Payload;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "bad_json" }), { status: 400 }); }
  if (!body.qr_secret || !body.event) {
    return new Response(JSON.stringify({ success: false, reason: "MISSING_FIELDS" }), { status: 200 });
  }

  // 1) child by qr_secret (RLS lets drivers of today's bookings read)
  const { data: child, error: childErr } = await sb
    .from("child").select("child_id, full_name, photo_url, qr_secret").eq("qr_secret", body.qr_secret).single();
  if (childErr || !child) return new Response(JSON.stringify({ success: false, reason: "INVALID_QR" }), { status: 200 });

  // 2) today's booking for this child (RLS filters to the driver's trips)
  const { data: bookings, error: bErr } = await sb
    .from("booking").select("booking_id, pickup_stop_id, drop_stop_id, trip:trip_id(trip_id, trip_date)").eq("child_id", child.child_id);
  if (bErr || !bookings?.length) return new Response(JSON.stringify({ success: false, reason: "NO_BOOKING_TODAY" }), { status: 200 });

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
  const booking = bookings.find(b => b.trip?.trip_date === today);
  if (!booking) return new Response(JSON.stringify({ success: false, reason: "NO_BOOKING_TODAY" }), { status: 200 });

  // 3) verify custody code (required for MVP)
  let ok = false;
  if (body.custody_code) {
    const { data: cc } = await sb
      .from("custody_code")
      .select("code, event, expires_at, used_at")
      .eq("booking_id", booking.booking_id)
      .eq("event", body.event)
      .single();

    if (cc && cc.code === body.custody_code && !cc.used_at && new Date(cc.expires_at) > new Date()) ok = true;
  }
  if (!ok) {
    await sb.from("scan_event").insert({
      booking_id: booking.booking_id,
      event: body.event,
      at_stop_id: body.event === "PICKUP" ? booking.pickup_stop_id : booking.drop_stop_id,
      lat: body.lat, lng: body.lng,
      custody_code_used: body.custody_code ?? null,
      success: false, reason: "BAD_OR_EXPIRED_CODE",
    });
    return new Response(JSON.stringify({ success: false, reason: "BAD_OR_EXPIRED_CODE" }), { status: 200 });
  }

  // 4) success scan_event
  const { error: insErr } = await sb.from("scan_event").insert({
    booking_id: booking.booking_id,
    event: body.event,
    at_stop_id: body.event === "PICKUP" ? booking.pickup_stop_id : booking.drop_stop_id,
    lat: body.lat, lng: body.lng,
    custody_code_used: body.custody_code,
    success: true,
  });
  if (insErr) return new Response(JSON.stringify({ success: false, reason: "INSERT_FAILED" }), { status: 500 });

  // 5) mark code used (service role bypasses RLS)
  const svc = createClient(supabaseUrl, service);
  await svc.from("custody_code")
    .update({ used_at: new Date().toISOString() })
    .eq("booking_id", booking.booking_id)
    .eq("event", body.event)
    .is("used_at", null);

  return new Response(JSON.stringify({ success: true, child: { child_id: child.child_id, full_name: child.full_name, photo_url: child.photo_url }, status: body.event }), { status: 200 });
});
