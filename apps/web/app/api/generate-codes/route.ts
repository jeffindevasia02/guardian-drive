import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { trip_id } = await req.json().catch(() => ({}));
  if (!trip_id) return NextResponse.json({ error: "trip_id required" }, { status: 400 });

  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: au } = await sb.from("app_user").select("role").eq("user_id", user!.id).single();
  if (au?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const edgeBase = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace("https://","").replace(".supabase.co","")}.functions.supabase.co`;

  // Call the edge function with SERVICE ROLE from server env (add it to Vercel)
  const r = await fetch(`${edgeBase}/generate-custody-codes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ trip_id })
  });

  const json = await r.json();
  return NextResponse.json(json, { status: r.status });
}
