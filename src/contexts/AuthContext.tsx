"use client";

import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from "react";
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react";
import { Gender } from "@/lib/title-system";

export type ActiveRole = "CLIENT" | "TRADER" | "ADMIN";

interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  titleId?: string;
  gender?: Gender;
  userType: "TRADER" | "BUYER" | "ADMIN";
  status: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeRole: ActiveRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithPhone: (phone: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithPhone: (phone: string, password: string, name: string, userType: string, titleId?: string, gender?: Gender) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string, userType: string, titleId?: string, gender?: Gender) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  switchRole: (role: ActiveRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const user = session?.user as unknown as User | null;
  const [activeRole, setActiveRole] = useState<ActiveRole | null>(null);

  useEffect(() => {
    if (user && !activeRole) {
      setActiveRole(user.userType === "BUYER" ? "CLIENT" : user.userType as ActiveRole);
    } else if (!user) {
      setActiveRole(null);
    }
  }, [user, activeRole]);

  const switchRole = useCallback((role: ActiveRole) => {
    setActiveRole(role);
  }, []);

  const loginWithPhone = useCallback(async (phone: string, password: string) => {
    const result = await signIn("credentials", {
      redirect: false,
      phone,
      password,
    });
    if (result?.error) {
      throw new Error(result.error);
    }
    window.location.href = "/";
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (result?.error) {
      throw new Error(result.error);
    }
    window.location.href = "/";
  }, []);

  const registerWithPhone = useCallback(async (phone: string, password: string, name: string, userType: string, titleId?: string, gender?: Gender) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, name, userType, titleId, gender }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "فشل إنشاء الحساب");
    }

    const result = await signIn("credentials", {
      redirect: false,
      phone,
      password,
    });
    
    if (result?.error) {
      throw new Error(result.error);
    }
    window.location.href = "/";
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string, name: string, userType: string, titleId?: string, gender?: Gender) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, userType, titleId, gender }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "فشل إنشاء الحساب");
    }

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    
    if (result?.error) {
      throw new Error(result.error);
    }
    window.location.href = "/";
  }, []);

  const logout = useCallback(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) return;
    try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            firstName: userData.firstName || user.firstName,
            lastName: userData.lastName || user.lastName,
            titleId: userData.titleId || user.titleId,
            gender: userData.gender || user.gender,
          }),
        });
        
        if (response.ok) {
           console.log("Profile updated");
        }
    } catch (error) {
        console.error("Error updating user on server:", error);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null, // Token isn't directly exposed in NextAuth client
        activeRole,
        isLoading,
        isAuthenticated: !!user,
        loginWithPhone,
        loginWithEmail,
        registerWithPhone,
        registerWithEmail,
        logout,
        updateUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
