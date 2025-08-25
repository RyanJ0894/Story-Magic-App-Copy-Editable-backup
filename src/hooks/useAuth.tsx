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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    console.log("🔐 AuthProvider: Setting up auth state listener");
    
    try {
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log("🔐 AuthProvider: Auth state changed", { event, hasSession: !!session });
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            setError(null);
          }
        }
      );

      // Check for existing session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log("🔐 AuthProvider: Initial session check", { hasSession: !!session, error });
        if (mounted) {
          if (error) {
            console.error("🔐 AuthProvider: Session error:", error);
            setError(error.message);
          }
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }).catch((err) => {
        console.error("🔐 AuthProvider: Failed to get session:", err);
        if (mounted) {
          setError(err.message);
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
        setError(err instanceof Error ? err.message : 'Auth setup failed');
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

  console.log("🔐 AuthProvider: Rendering", { loading, hasUser: !!user, error });

  // Show error state if auth failed to initialize
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-foreground mb-4">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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