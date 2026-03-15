import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const AUTO_EMAIL = "admin@creative-core.app";
const AUTO_PASS = "CC#Admin2026!Secure";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const autoLoginAttempted = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) setIsLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setIsLoading(false);
      } else if (!autoLoginAttempted.current) {
        autoLoginAttempted.current = true;
        await autoSignIn();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const autoSignIn = async () => {
    // Try sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: AUTO_EMAIL,
      password: AUTO_PASS,
    });
    if (!signInError) return;

    // If account doesn't exist, create it
    const { error: signUpError } = await supabase.auth.signUp({
      email: AUTO_EMAIL,
      password: AUTO_PASS,
      options: { data: { display_name: "Admin" } },
    });
    if (signUpError) {
      console.error("Auto auth failed:", signUpError.message);
      setIsLoading(false);
      return;
    }

    // Sign in after signup
    await supabase.auth.signInWithPassword({
      email: AUTO_EMAIL,
      password: AUTO_PASS,
    });
    setIsLoading(false);
  };

  const signOut = async () => {
    try {
      autoLoginAttempted.current = true; // prevent auto re-login after signout
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error.message);
      }
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error("Unexpected sign out error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
