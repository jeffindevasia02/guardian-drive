import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export default async function Home() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  redirect(user ? "/dashboard" : "/login");
}