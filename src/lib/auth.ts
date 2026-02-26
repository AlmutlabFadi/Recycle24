import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { findDemoUser, isDemoMode } from "@/lib/demo-data";

interface AuthUser {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    userType?: string | null;
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
                    // Demo mode
                    if (isDemoMode) {
                        const identifier = email || phone;
                        const demoUser = findDemoUser(identifier);
                        if (!demoUser || password !== "123456") {
                            throw new Error("Invalid credentials");
                        }
                        return {
                            id: demoUser.id,
                            name: demoUser.name,
                            email: demoUser.email,
                            phone: demoUser.phone,
                            role: demoUser.role || "TRADER",
                            userType: demoUser.userType,
                        };
                    }

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
                const authUser = user as AuthUser;
                token.id = authUser.id;
                token.role = authUser.role ?? undefined;
                token.userType = authUser.userType ?? undefined;
                token.phone = authUser.phone ?? undefined;
                token.email = authUser.email ?? undefined;
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
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "default-secret-please-set-NEXTAUTH_SECRET-in-production",
    pages: {
        signIn: '/login',
    }
};
