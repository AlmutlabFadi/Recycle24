import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";

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
  adminAccessEnabled?: boolean;
}

interface Credentials {
  phone?: string;
  email?: string;
  password: string;
}

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
    status?: string;
    isVerified?: boolean;
    isLocked?: boolean;
    lockReason?: string | null;
    adminAccessEnabled?: boolean;
    permissions?: string[];
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

        const { phone, email, password } = credentials as Record<string, string> & Credentials;

        if (!phone && !email) {
          throw new Error("Email or Phone is required");
        }

        const user = await (db.user.findFirst as any)({
          where: {
            OR: [
              email ? { email } : null,
              phone ? { phone } : null,
            ].filter((entry): entry is { email: string } | { phone: string } => entry !== null),
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
            adminAccessEnabled: true,
          },
        });

        if (!user || !(user as any).password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await compare(password, (user as any).password);

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
          adminAccessEnabled: (user as any).adminAccessEnabled,
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

        token.id = authUser.id;
        token.role = authUser.role ?? undefined;
        token.userType = authUser.userType ?? undefined;
        token.phone = authUser.phone ?? undefined;
        token.email = authUser.email ?? undefined;
        token.status = authUser.status ?? undefined;
        token.isVerified = authUser.isVerified ?? undefined;
        token.isLocked = authUser.isLocked ?? undefined;
        token.lockReason = authUser.lockReason ?? undefined;
        token.adminAccessEnabled = authUser.adminAccessEnabled ?? true;
        token.permissions = await loadUserPermissions(authUser.id);
      }

      if (trigger === "update" && token.id) {
        token.permissions = await loadUserPermissions(token.id);
        // Also refresh adminAccessEnabled, userType, role, and status on update
        const dbUser = await (db.user.findUnique as any)({ 
          where: { id: token.id }, 
          select: { adminAccessEnabled: true, userType: true, role: true, status: true } 
        });
        if (dbUser) {
          token.adminAccessEnabled = (dbUser as any).adminAccessEnabled;
          token.userType = (dbUser as any).userType;
          token.role = (dbUser as any).role;
          token.status = (dbUser as any).status;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.userType = token.userType;
        session.user.phone = token.phone;
        session.user.email = token.email;
        session.user.status = token.status;
        session.user.isVerified = token.isVerified;
        session.user.isLocked = token.isLocked;
        session.user.lockReason = token.lockReason;
        session.user.adminAccessEnabled = token.adminAccessEnabled ?? true;
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
