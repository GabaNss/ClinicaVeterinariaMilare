import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ searchParams }: { searchParams?: { reason?: string } }) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const reason = searchParams?.reason;

  if (data.user && !reason) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <LoginForm reason={reason} />
    </main>
  );
}
