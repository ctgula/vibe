import { NextResponse }          from "next/server";
import { getServerSession }      from "next-auth";
import NextAuth                  from "next-auth";
import { createClient }          from "@supabase/supabase-js";

export const runtime = "nodejs";            // ← ensures Node, not Edge

export async function POST(req: Request) {
  /* ─────────────────────────────────────────────
     1.  Gate: user must be signed-in
  ──────────────────────────────────────────────*/
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  /* ─────────────────────────────────────────────
     2.  Supabase client (service-role key = full SQL access)
  ──────────────────────────────────────────────*/
  // Temporary debug log to verify the service role key is accessible
  console.log("service key?", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0,8));
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,        // e.g. https://ansqfdzcxwhqoloovotu.supabase.co
    process.env.SUPABASE_SERVICE_ROLE_KEY!        // long jwt …_service_role…
  );

  /* ─────────────────────────────────────────────
     3.  Parse body  { sql: "...", params: {...} }
  ──────────────────────────────────────────────*/
  const { sql, params } = await req.json();

  if (typeof sql !== "string") {
    return NextResponse.json(
      { error: "SQL must be a string" },
      { status: 400 }
    );
  }

  /* ─────────────────────────────────────────────
     4.  Execute via PostgreSQL `execute` RPC
         (function created in your DB)
  ──────────────────────────────────────────────*/
  const { data, error } = await supabase
    .rpc("execute", { sql, params });

  if (error) {
    return NextResponse.json(
      { error: "Failed to execute SQL", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
