import { cookies } from "next/headers";

type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createNoopSupabaseClient() {
  const noopQuery = {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    order() {
      return this;
    },
    limit() {
      return this;
    },
    maybeSingle() {
      return Promise.resolve({ data: null, error: null });
    },
    single() {
      return Promise.resolve({ data: null, error: null });
    },
    insert() {
      return this;
    },
    update() {
      return this;
    },
    delete() {
      return this;
    },
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from() {
      return noopQuery;
    },
    storage: {
      from() {
        return {
          upload: async () => ({ data: null, error: null }),
          remove: async () => ({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        };
      },
    },
  } as any;
}

export type AppRole = "CUSTOMER" | "ADMIN" | "VENDOR" | "TAILOR";

export interface AppUserProfile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  assignedStitcherSlug: string | null;
}

function normalizeProfile(user: any, fallback: Partial<AppUserProfile> = {}): AppUserProfile {
  const metadata = user?.user_metadata ?? {};
  const role = (metadata.role ?? fallback.role ?? "CUSTOMER") as AppRole;
  const assignedStitcherSlug = (metadata.assigned_stitcher_slug ??
    fallback.assignedStitcherSlug ??
    null) as string | null;

  return {
    id: user?.id ?? fallback.id ?? "",
    name: (metadata.name ?? fallback.name ?? user?.email ?? "") as string,
    email: user?.email ?? fallback.email ?? "",
    role,
    assignedStitcherSlug,
  };
}

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured) {
    return createNoopSupabaseClient();
  }

  const { createServerClient } = await import("@supabase/ssr");
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        for (const cookie of cookiesToSet) {
          cookieStore.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  });
}

export async function createAdminSupabaseClient() {
  if (!supabaseServiceRoleKey || !isSupabaseConfigured) {
    return createNoopSupabaseClient();
  }

  const { createClient } = await import("@supabase/supabase-js");

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  let profile: AppUserProfile | null = null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (data) {
    profile = normalizeProfile(
      {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          name: data.name,
          role: data.role,
          assigned_stitcher_slug: data.assigned_stitcher_slug,
        },
      },
      {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        assignedStitcherSlug: data.assigned_stitcher_slug,
      }
    );
  } else {
    profile = normalizeProfile(user);
  }

  return { user, profile };
}
