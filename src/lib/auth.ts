import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const inputEmail = credentials.email.trim().toLowerCase();
        const isEmailMatch = inputEmail === "admin" || inputEmail === "admin@example.com";
        const isPasswordMatch = credentials.password === "bungu" || credentials.password === "admin";
        
        if (isEmailMatch && isPasswordMatch) {
          let user = await db.user.findUnique({
            where: { email: "admin@example.com" }
          });
          
          if (!user) {
            user = await db.user.create({
              data: {
                email: "admin@example.com",
                name: "Admin",
                role: "admin",
              }
            });
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }
        
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
};
