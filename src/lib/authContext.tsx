import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
  accountType: "admin" | "customer";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin email domains
const ADMIN_EMAILS = ["acharyaomshah@gmail.com"];
const ADMIN_DOMAINS = ["@admin.divine"];

const isAdminUser = (email: string | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email) || ADMIN_DOMAINS.some(domain => email.endsWith(domain));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (supabaseUser?.email) {
          const adminStatus = isAdminUser(supabaseUser.email);
          const accountType = adminStatus ? "admin" : "customer";

          // Try to save/update user in our users table
          try {
            await fetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: supabaseUser.id,
                email: supabaseUser.email,
                isAdmin: adminStatus,
                accountType: accountType,
                fullName: supabaseUser.user_metadata?.full_name || ""
              })
            });
          } catch (err) {
            console.log("User profile sync failed (backend may not be ready):", err);
          }

          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email,
            isAdmin: adminStatus,
            accountType: accountType
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        const adminStatus = isAdminUser(session.user.email);
        const accountType = adminStatus ? "admin" : "customer";

        // Try to save/update user in our users table
        try {
          await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              isAdmin: adminStatus,
              accountType: accountType,
              fullName: session.user.user_metadata?.full_name || ""
            })
          });
        } catch (err) {
          console.log("User profile sync failed:", err);
        }

        setUser({
          id: session.user.id,
          email: session.user.email,
          isAdmin: adminStatus,
          accountType: accountType
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            email: email
          }
        }
      });

      if (error) throw error;

      // Save user to our database
      if (data.user) {
        const adminStatus = isAdminUser(email);
        const accountType = adminStatus ? "admin" : "customer";
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data.user.id,
            email: email,
            isAdmin: adminStatus,
            accountType: accountType,
            fullName: name
          })
        }).catch(err => console.log("User profile save failed:", err));
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Update user in our database
      if (data.user) {
        const adminStatus = isAdminUser(email);
        const accountType = adminStatus ? "admin" : "customer";
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data.user.id,
            email: email,
            isAdmin: adminStatus,
            accountType: accountType,
            fullName: data.user.user_metadata?.full_name || ""
          })
        }).catch(err => console.log("User profile update failed:", err));
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.isAdmin || false, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      loading: true,
      isAdmin: false,
      signUp: async () => { },
      signIn: async () => { },
      signOut: async () => { }
    };
  }
  return context;
}
