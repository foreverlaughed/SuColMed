import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone: { label: "手机号", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;

        const phone = credentials.phone as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { id: user.id, name: user.name, phone: user.phone, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
