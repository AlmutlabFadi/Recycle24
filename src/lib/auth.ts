import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";

import { db } from "@/lib/db";

interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  userType?: string | null;
  status?: string | null;
  isVerified?: boolean;
  isLocked?: boolean;
  lockReason?: string | null;
}

interface Credentials {
  phone?: string;
  email?: string;
  password: string;
}

type DbUserSnapshot = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  userType: string;
  status: string;
  isVerified: boolean;
  isLocked: boolean;
  lockReason: string | null;
};

const PERMISSIONS_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

declare module "next-auth" {
  interface Session {
    user: AuthUser & {
      permissions?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    userType?: string;
    phone?: string;
    email?: string;
    name?: string;
    status?: string;
    isVerified?: boolean;
    isLocked?: boolean;
    lockReason?: string | null;
    permissions?: string[];
    permissionsRefreshedAt?: number;
  }
}

async function loadUserPermissions(userId: string): Promise<string[]> {
  const roles = await db.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          rolePermissions: {
            select: {
              permission: {
                select: {
                  key: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();

  for (const userRole of roles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      permissions.add(rolePermission.permission.key);
    }
  }

  return Array.from(permissions);
}

async function loadUserSnapshot(userId: string): Promise<DbUserSnapshot | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      userType: true,
      status: true,
      isVerified: true,
      isLocked: true,
      lockReason: true,
    },
  });

  return user;
}

async function loadAuthState(userId: string) {
  const [user, permissions] = await Promise.all([
    loadUserSnapshot(userId),
    loadUserPermissions(userId),
  ]);

  return { user, permissions };
}

function shouldRefreshToken(token: {
  id?: string;
  permissions?: string[];
  permissionsRefreshedAt?: number;
  role?: string;
  userType?: string;
  status?: string;
}) {
  if (!token.id) return false;
  if (!token.permissions) return true;
  if (!token.role || !token.userType || !token.status) return true;
  if (!token.permissionsRefreshedAt) return true;

  return Date.now() - token.permissionsRefreshedAt > PERMISSIONS_REFRESH_INTERVAL_MS;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions["adapter"],
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials) {
          throw new Error("Credentials are required");
        }

        const { phone, email, password } =
          credentials as Record<string, string> & Credentials;

        if (!phone && !email) {
          throw new Error("Email or Phone is required");
        }

        const user = await db.user.findFirst({
          where: {
            OR: [
              email ? { email } : null,
              phone ? { phone } : null,
            ].filter(
              (entry): entry is { email: string } | { phone: string } =>
                entry !== null
            ),
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            password: true,
            role: true,
            userType: true,
            status: true,
            isVerified: true,
            isLocked: true,
            lockReason: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await compare(password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          userType: user.userType,
          status: user.status,
          isVerified: user.isVerified,
          isLocked: user.isLocked,
          lockReason: user.lockReason,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const authUser = user as AuthUser;
        const authState = await loadAuthState(authUser.id);

        if (!authState.user) {
          return token;
        }

        token.id = authState.user.id;
        token.name = authState.user.name ?? undefined;
        token.role = authState.user.role ?? undefined;
        token.userType = authState.user.userType ?? undefined;
        token.phone = authState.user.phone ?? undefined;
        token.email = authState.user.email ?? undefined;
        token.status = authState.user.status ?? undefined;
        token.isVerified = authState.user.isVerified ?? undefined;
        token.isLocked = authState.user.isLocked ?? undefined;
        token.lockReason = authState.user.lockReason ?? undefined;
        token.permissions = authState.permissions;
        token.permissionsRefreshedAt = Date.now();

        return token;
      }

      if (trigger === "update" && token.id) {
        const authState = await loadAuthState(token.id);

        if (!authState.user) {
          return token;
        }

        token.name = authState.user.name ?? undefined;
        token.role = authState.user.role ?? undefined;
        token.userType = authState.user.userType ?? undefined;
        token.phone = authState.user.phone ?? undefined;
        token.email = authState.user.email ?? undefined;
        token.status = authState.user.status ?? undefined;
        token.isVerified = authState.user.isVerified ?? undefined;
        token.isLocked = authState.user.isLocked ?? undefined;
        token.lockReason = authState.user.lockReason ?? undefined;
        token.permissions = authState.permissions;
        token.permissionsRefreshedAt = Date.now();

        return token;
      }

      if (shouldRefreshToken(token)) {
        const authState = await loadAuthState(token.id);

        if (!authState.user) {
          return token;
        }

        token.name = authState.user.name ?? undefined;
        token.role = authState.user.role ?? undefined;
        token.userType = authState.user.userType ?? undefined;
        token.phone = authState.user.phone ?? undefined;
        token.email = authState.user.email ?? undefined;
        token.status = authState.user.status ?? undefined;
        token.isVerified = authState.user.isVerified ?? undefined;
        token.isLocked = authState.user.isLocked ?? undefined;
        token.lockReason = authState.user.lockReason ?? undefined;
        token.permissions = authState.permissions;
        token.permissionsRefreshedAt = Date.now();
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.userType = token.userType;
        session.user.phone = token.phone;
        session.user.email = token.email;
        session.user.status = token.status;
        session.user.isVerified = token.isVerified;
        session.user.isLocked = token.isLocked;
        session.user.lockReason = token.lockReason;
        session.user.permissions = token.permissions ?? [];
      }

      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    "default-secret-please-set-NEXTAUTH_SECRET-in-production",
  pages: {
    signIn: "/login",
  },
};
