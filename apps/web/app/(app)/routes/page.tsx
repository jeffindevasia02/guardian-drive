import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RoutesPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: au } = await sb.from("app_user").select("role").eq("user_id", user!.id).single();
  if (au?.role !== "ADMIN") redirect("/dashboard");

  const { data: routes, error } = await sb.from("route").select("*").order("name");
  if (error) return <pre>{error.message}</pre>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Routes</h1>
      <table><thead><tr><th>Name</th><th>Active</th></tr></thead>
      <tbody>
        {(routes ?? []).map(r => (
          <tr key={r.route_id}><td>{r.name}</td><td>{String(r.active)}</td></tr>
        ))}
      </tbody></table>
    </main>
  );
}
