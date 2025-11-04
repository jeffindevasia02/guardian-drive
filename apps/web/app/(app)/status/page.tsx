import { createClient } from "@/lib/supabase/server";

export default async function StatusPage() {
  const sb = createClient();
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
  const { data, error } = await sb
    .from("v_parent_today_status")
    .select("*");

  if (error) return <pre>{error.message}</pre>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Today’s Status</h1>
      <ul>
        {(data ?? []).map((r: any) => (
          <li key={r.booking_id}>
            {r.child_id} — {r.session} — {r.latest_event ?? "Awaiting pickup"}
          </li>
        ))}
      </ul>
    </main>
  );
}
