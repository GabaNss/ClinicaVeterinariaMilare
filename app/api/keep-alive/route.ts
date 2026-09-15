import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("tutores").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
