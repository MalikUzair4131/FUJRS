const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
        signUp: async () => ({ data: { user: null, session: null }, error: null }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: (cb: any) => {
          const subscription = { unsubscribe: () => {} };
          return { data: { subscription } };
        },
      },
    } as any;
  }

  return require("@supabase/ssr").createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const browserSupabase = createBrowserSupabaseClient();
