import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Runs as the signed in user, so every read and write goes through RLS.
 *
 * Next 16: cookies() is async and must be awaited, so this is async too.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read only.
            // proxy.ts refreshes the session, so this is safe to swallow.
          }
        },
      },
    },
  );
}

/**
 * The signed in user's profile, or null. Uses getUser() rather than
 * getSession() because getUser() revalidates the token against Supabase;
 * a session read from a cookie can be forged.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, ranks(*)")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return {
    id: user.id,
    email: user.email ?? null,
    profile,
    roles: (roles ?? []).map((r) => r.role),
    isStaff: (roles ?? []).some((r) =>
      ["reviewer", "support", "finance", "admin", "owner"].includes(r.role),
    ),
    isAdmin: (roles ?? []).some((r) => ["admin", "owner"].includes(r.role)),
  };
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
