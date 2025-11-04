"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Debug() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Debug</h1>
      <pre>{token ? token : "No session/token (are you logged in?)"}</pre>
    </main>
  );
}
