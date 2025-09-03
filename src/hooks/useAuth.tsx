import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log("🔐 AuthProvider: Starting initialization");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    console.log("🔐 AuthProvider: Setting up auth state listener");
    
    try {
      // Set up auth state listener first
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log("🔐 AuthProvider: Auth state changed", { event, hasSession: !!session });
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        }
      );

      // Check for existing session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log("🔐 AuthProvider: Initial session check", { hasSession: !!session, error });
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }).catch((err) => {
        console.error("🔐 AuthProvider: Failed to get session:", err);
        if (mounted) {
          setLoading(false);
        }
      });

      return () => {
        console.log("🔐 AuthProvider: Cleaning up");
        mounted = false;
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error("🔐 AuthProvider: Setup error:", err);
      if (mounted) {
        setLoading(false);
      }
    }
  }, []);

  const signOut = async () => {
    try {
      // Try to invalidate the server session, but ignore if it's already gone
      await supabase.auth.signOut({ scope: 'global' }).catch(() => {})
      // Always clear local session to prevent redirect loops
      await supabase.auth.signOut({ scope: 'local' })
    } finally {
      setSession(null)
      setUser(null)
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  console.log("🔐 AuthProvider: Rendering", { loading, hasUser: !!user });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};