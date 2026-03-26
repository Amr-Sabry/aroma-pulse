// src/types/next-auth.d.ts
import type { User as NextAuthUser, Session as NextAuthSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      role: string;
      avatar?: string;
    };
  }
  interface User extends NextAuthUser {
    id: string;
    username: string;
    name: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: string;
  }
}

// Re-export for convenience
export type { NextAuthUser, NextAuthSession };
