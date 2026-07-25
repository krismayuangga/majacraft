import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        if (user.status === "BANNED") throw new Error("Akun Anda telah diblokir.");
        if (user.status === "SUSPENDED") throw new Error("Akun sedang ditangguhkan.");
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. Initial sign-in — set data dari provider
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? "BUYER";
        token.name = user.name;
        return token;
      }

      // 2. Manual update() dari client (e.g. setelah upgrade role / ganti foto)
      if (trigger === "update") {
        if (session?.name)  token.name  = session.name;
        if (session?.role)  token.role  = session.role;
        if (session?.image !== undefined) token.image = session.image; // update foto profil
        return token;
      }

      // 3. Token refresh biasa — sinkronkan role dari DB
      // Ini memastikan perubahan role (upgrade Seniman) langsung terefleksi
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, name: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            if (dbUser.name && !session?.name) token.name = dbUser.name;
          }
        } catch { /* DB tidak tersedia, pakai token lama */ }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id    = token.id as string;
        (session.user as { role?: string }).role  = token.role as string;
        if (token.name)  session.user.name  = token.name as string;
        if (token.image !== undefined) session.user.image = token.image as string | null; // sinkron foto profil
      }
      return session;
    },
  },
});
