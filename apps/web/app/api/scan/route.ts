import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const sb = createClient();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const edgeBase = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace("https://","").replace(".supabase.co","")}.functions.supabase.co`;

  const r = await fetch(`${edgeBase}/scan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const json = await r.json();
  return NextResponse.json(json, { status: r.status });
}
