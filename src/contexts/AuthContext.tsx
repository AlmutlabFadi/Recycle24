"use client";

import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from "react";
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react";
import { Gender } from "@/lib/title-system";

export type ActiveRole = "CLIENT" | "TRADER" | "ADMIN" | "DRIVER" | "GOVERNMENT";

interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  titleId?: string;
  gender?: Gender;
  isVerified: boolean;
  userType: "TRADER" | "CLIENT" | "ADMIN" | "DRIVER" | "GOVERNMENT";
  status: string;
  role?: string;
  adminAccessEnabled?: boolean;
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
  const [activeRole, setActiveRoleState] = useState<ActiveRole | null>(null);

  // Initialize role from localStorage or default
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const savedRole = localStorage.getItem(`activeRole_${user.id}`) as ActiveRole;
      if (savedRole) {
        setActiveRoleState(savedRole);
      } else {
        // 🛠️ FIX: Default to ADMIN if they are staff, otherwise CLIENT
        const defaultRole = user.userType === "ADMIN" ? "ADMIN" : (user.userType as ActiveRole) || "CLIENT";
        setActiveRoleState(defaultRole);
        localStorage.setItem(`activeRole_${user.id}`, defaultRole);
      }
    } else if (!user) {
      setActiveRoleState(null);
    }
  }, [user]);

  const setActiveRole = useCallback((role: ActiveRole | null) => {
    setActiveRoleState(role);
    if (user && role) {
      localStorage.setItem(`activeRole_${user.id}`, role);
    }
  }, [user]);

  const switchRole = useCallback((role: ActiveRole) => {
    setActiveRole(role);
  }, [setActiveRole]);

  const loginWithPhone = useCallback(async (phone: string, password: string) => {
    const result = await signIn("credentials", {
      redirect: false,
      phone,
      password,
    });
    if (result?.error) {
      throw new Error(result.error);
    }
    // Check userType and redirect ADMIN to the control tower
    const sessRes = await fetch('/api/auth/session');
    const sess = sessRes.ok ? await sessRes.json().catch(() => null) : null;
    
    if (sess?.user?.userType === 'ADMIN') {
        window.location.href = '/admin/dashboard';
    } else {
        window.location.href = '/dashboard';
    }
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
    // Check userType and redirect ADMIN to the control tower
    const sessRes2 = await fetch('/api/auth/session');
    const sess = sessRes2.ok ? await sessRes2.json().catch(() => null) : null;
    
    if (sess?.user?.userType === 'ADMIN') {
        window.location.href = '/admin/dashboard';
    } else {
        window.location.href = '/dashboard';
    }
  }, []);

  const registerWithPhone = useCallback(async (phone: string, password: string, name: string, userType: string, titleId?: string, gender?: Gender) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, name, userType, titleId, gender }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "ÙØ´Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨");
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
      throw new Error(data.error || "ÙØ´Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨");
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

