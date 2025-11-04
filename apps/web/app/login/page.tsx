"use client";
import { supabase } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN") router.replace("/dashboard");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <main style={{ maxWidth: 420, margin: "6rem auto" }}>
      <h1 style={{ marginBottom: 16 }}>Sign in</h1>
      <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} />
    </main>
  );
}
