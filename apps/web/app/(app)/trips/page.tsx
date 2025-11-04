import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type TripRow = {
  trip_id: string;
  trip_date: string;
  session: string;
  vehicle_label: string | null;
  // Supabase may return object or array depending on inference
  route?: { name: string } | { name: string }[] | null;
};

const getRouteName = (route: TripRow["route"]) =>
  Array.isArray(route) ? route?.[0]?.name ?? "" : route?.name ?? "";

export default async function TripsPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: au } = await sb.from("app_user").select("role").eq("user_id", user!.id).single();
  if (au?.role !== "ADMIN") redirect("/dashboard");

  const { data, error } = await sb
    .from("trip")
    .select("trip_id, trip_date, session, vehicle_label, route:route_id(name)")
    .order("trip_date", { ascending: false })
    .limit(50);

  if (error) return <pre>{error.message}</pre>;
  const rows = (data ?? []) as TripRow[];

  return (
    <main style={{ padding: 24 }}>
      <h1>Trips</h1>
      <table>
        <thead>
          <tr><th>Date</th><th>Session</th><th>Route</th><th>Vehicle</th></tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.trip_id}>
              <td>{t.trip_date}</td>
              <td>{t.session}</td>
              <td>{getRouteName(t.route)}</td>
              <td>{t.vehicle_label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
