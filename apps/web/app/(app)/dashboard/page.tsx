import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // fetch role from app_user
  const { data: au } = await supabase.from("app_user").select("full_name, role").eq("user_id", user!.id).single();

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Hello {au?.full_name ?? "User"} ({au?.role ?? "UNKNOWN"})</p>

      {au?.role === "ADMIN" && (
        <ul style={{ marginTop: 16 }}>
          <li><a href="/routes">Routes</a></li>
          <li><a href="/stops">Stops</a></li>
          <li><a href="/trips">Trips</a></li>
          <li><a href="/audit">Audit</a></li>
        </ul>
      )}
      {au?.role === "PARENT" && (
        <ul style={{ marginTop: 16 }}>
          <li><a href="/kids">My Kids</a></li>
          <li><a href="/status">Today’s Status</a></li>
        </ul>
      )}
    </main>
  );
}
