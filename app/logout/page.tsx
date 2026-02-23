import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function LogoutPage() {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
