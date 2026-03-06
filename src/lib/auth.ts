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
    isLocked?: boolean;
    lockReason?: string | null;
}

interface Credentials {
    phone?: string;
    email?: string;
    password: string;
}

declare module "next-auth" {
    interface Session {
        user: AuthUser;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role?: string;
        userType?: string;
        phone?: string;
        email?: string;
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db) as NextAuthOptions["adapter"],
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                phone: { label: "Phone", type: "text" },
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: Record<string, string> | undefined) {
                if (!credentials) {
                    throw new Error("Credentials are required");
                }

                const { phone, email, password } = credentials as Record<string, string> & Credentials;
                if (!phone && !email) {
                    throw new Error("Email or Phone is required");
                }

                try {
                    // Real DB mode
                    const user = await db.user.findFirst({
                        where: {
                            OR: [email ? { email } : null, phone ? { phone } : null].filter(
                                (entry): entry is { email: string } | { phone: string } => entry !== null
                            )
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
                        }
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
                    };
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Unknown auth error";
                    throw new Error(`An error occurred: ${message}`);
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const authUser = user as any;
                token.id = authUser.id;
                token.role = authUser.role ?? undefined;
                token.userType = authUser.userType ?? undefined;
                token.phone = authUser.phone ?? undefined;
                token.email = authUser.email ?? undefined;
                token.status = authUser.status ?? undefined;
                token.isVerified = authUser.isVerified ?? undefined;
                token.isLocked = authUser.isLocked ?? undefined;
                token.lockReason = authUser.lockReason ?? undefined;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).userType = token.userType;
                (session.user as any).phone = token.phone;
                (session.user as any).email = token.email;
                (session.user as any).status = token.status;
                (session.user as any).isVerified = token.isVerified;
                (session.user as any).isLocked = token.isLocked;
                (session.user as any).lockReason = token.lockReason;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "default-secret-please-set-NEXTAUTH_SECRET-in-production",
    pages: {
        signIn: '/login',
    }
};
