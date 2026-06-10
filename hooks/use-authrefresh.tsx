// contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  updateSession: () => Promise<Session | null | undefined>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [session]);

  const updateSession = async () => {
    return await update();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    if (!session || !session.accessToken || !session.expires) {
      if (!loading) {
        console.warn("🚨 No session, access token, or expires found. Refresh check skipped.");
      }
      return;
    }

    const refreshTokenBeforeExpiry = async () => {
      const bufferTime = 5 * 60 * 1000; // Refresh 5 min before expiry
      const now = Date.now();
      const expiresAt = Date.parse(session.expires);
      
      if (expiresAt - now < bufferTime) {
        // Show toast notification properly 
        toast.info("🔄 Refreshing access token...", {
          duration: 3000,
          position: 'top-right',
        });

        const updatedSession = await update();

        if (!updatedSession?.accessToken) {
          // Show error toast properly
          toast.error("❌ Failed to refresh session, signing out...", {
            duration: 5000,
            position: 'top-right',
          });
          console.warn("❌ Failed to refresh session, signing out...");
          await signOut();
        } else {
          // Show success toast when token is refreshed (optional)
          toast.success("✅ Session refreshed successfully", {
            duration: 3000,
            position: 'top-right',
          });
        }
      }
    };

    const interval = setInterval(refreshTokenBeforeExpiry, 60 * 1000); // Check every 1 min
    return () => {
      clearInterval(interval);
    };
  }, [session, update, loading]);

  const value = {
    session,
    loading,
    updateSession,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}