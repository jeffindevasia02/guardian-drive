import { createClient } from "@/lib/supabase/server";

export default async function KidsPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();

  // children linked to this parent (RLS enforces)
  const { data: kids, error } = await sb
    .from("child")
    .select("child_id, full_name, photo_url")
    .order("full_name");

  if (error) return <pre>{error.message}</pre>;

  return (
    <main style={{ padding: 24 }}>
      <h1>My Kids</h1>
      <ul>
        {(kids ?? []).map(k => (
          <li key={k.child_id}>{k.full_name}</li>
        ))}
      </ul>
    </main>
  );
}
