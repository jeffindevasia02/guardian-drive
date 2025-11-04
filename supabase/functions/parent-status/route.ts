import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const sb = createClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('https://','').replace('.supabase.co','')}.functions.supabase.co/parent-status`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "error" }, { status: 500 });
  }
}
