import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(url, anon, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  // RLS: parents see only their children; drivers/admins per their policies
  const { data, error } = await sb
    .from("booking")
    .select(`
      booking_id, child_id,
      child:child_id(full_name, photo_url),
      trip:trip_id(trip_id, trip_date, session),
      latest:scan_event!scan_event_booking_id_fkey(event, success, created_at)
    `);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const items = (data ?? []).map((b: any) => {
    const latest = (b.latest ?? []).filter((e: any) => e.success)
      .sort((a: any, c: any) => c.created_at.localeCompare(a.created_at))[0];

    return {
      booking_id: b.booking_id,
      child_id: b.child_id,
      child_name: b.child?.full_name,
      photo_url: b.child?.photo_url,
      trip_id: b.trip?.trip_id,
      trip_date: b.trip?.trip_date,
      session: b.trip?.session,
      latest_event: latest?.event ?? null,
      latest_at: latest?.created_at ?? null
    };
  });

  return new Response(JSON.stringify({ items }), { status: 200 });
});
