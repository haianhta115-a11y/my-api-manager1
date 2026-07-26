import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Account / Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const inputEmail = credentials.email.trim().toLowerCase();
        const inputPassword = credentials.password.trim();

        // 1. Admin Master Account check: hjk / haianh
        const isAdminMatch =
          (inputEmail === "hjk" || inputEmail === "hjk@admin.com" || inputEmail === "admin") &&
          (inputPassword === "haianh" || inputPassword === "bungu" || inputPassword === "admin");

        if (isAdminMatch) {
          let adminUser = await db.user.findFirst({
            where: {
              OR: [
                { email: "hjk@admin.com" },
                { name: "hjk" },
                { role: "admin" }
              ]
            }
          });

          if (!adminUser) {
            adminUser = await db.user.create({
              data: {
                email: "hjk@admin.com",
                name: "hjk",
                password: "haianh",
                role: "admin",
                status: "active"
              }
            });
          }

          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name || "hjk",
            role: "admin",
          };
        }

        // 2. Normal Account / Sub-Account check from DB
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: inputEmail },
              { name: inputEmail }
            ]
          }
        });

        if (user && user.password === inputPassword) {
          if (user.status === "blocked" || user.status === "kicked") {
            throw new Error("Tài khoản này đã bị khóa hoặc thu hồi truy cập.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || inputEmail,
            role: user.role || "user",
          };
        }

        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days persistent login session
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "user";
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
};
