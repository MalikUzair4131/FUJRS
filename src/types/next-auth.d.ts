import { DefaultSession } from "next-auth";

export type UserRole = "CUSTOMER" | "ADMIN" | "VENDOR" | "TAILOR";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    assignedStitcherSlug: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      assignedStitcherSlug: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    assignedStitcherSlug: string | null;
  }
}
