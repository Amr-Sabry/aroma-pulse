import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/firebase";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      role: Role;
      avatar?: string;
    };
  }
  interface User {
    id: string;
    username: string;
    name: string;
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Aroma Studios",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username as string;
        const password = credentials.password as string;

        try {
          // Dynamic import to avoid Edge runtime issues with bcryptjs
          const { compare } = await import("bcryptjs");
          const { collection, getDocs } = await import("firebase/firestore");

          // Find user by username in Firestore
          const usersRef = collection(db, "aroma-pulse/production/users");
          const snapshot = await getDocs(usersRef);

          let foundUser: {
            id: string;
            username: string;
            name: string;
            password: string;
            role: Role;
          } | undefined;

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.username?.toLowerCase() === username.toLowerCase()) {
              foundUser = { id: docSnap.id, ...data } as typeof foundUser;
            }
          });

          if (!foundUser) return null;

          const isValid = await compare(password, foundUser.password);
          if (!isValid) return null;

          return {
            id: foundUser.id,
            username: foundUser.username,
            name: foundUser.name,
            role: foundUser.role || "creative",
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "aroma-pulse-secret-key-2026",
});
