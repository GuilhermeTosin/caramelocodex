import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { getProfileById, updateProfile } from "@/services/profiles";
import { getUnreadCount } from "@/services/messages";
import type { UserFrontend, AuthSessionFrontend } from "@/types/database";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  session: AuthSessionFrontend | null;
  user: UserFrontend | null;
  isLoading: boolean;
  unreadMessages: number;
  refreshSession: () => void;
  refreshUnread: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSessionFrontend | null>(null);
  const [user, setUser] = useState<UserFrontend | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Ref para evitar m?ltiplas chamadas simult?neas de carregamento de perfil
  const loadingUserIdRef = useRef<string | null>(null);

  const buildSession = useCallback(
    (supaSession: Session | null): AuthSessionFrontend | null => {
      if (!supaSession?.user) return null;
      return {
        userId: supaSession.user.id,
        email: supaSession.user.email || "",
        name: supaSession.user.user_metadata?.name || supaSession.user.email?.split("@")[0] || "Usuário",
      };
    },
    []
  );

  const loadUserAndUnread = useCallback(async (userId: string, email: string) => {
    // Se j? estiver carregando ESTE Usuário, ignora mas garante que o loading termine
    if (loadingUserIdRef.current === userId) {
      setIsLoading(false);
      return;
    }
    loadingUserIdRef.current = userId;

    try {
      console.log("AuthContext: Iniciando carregamento para", userId);
      let profile = await getProfileById(userId);
      
      if (!profile) {
        console.log("AuthContext: Perfil não encontrado, tentando criar...");
        const defaultName = email.split("@")[0] || "Usuário";
        const success = await updateProfile(userId, { name: defaultName });
        if (success) {
          profile = await getProfileById(userId);
        }
      }

      if (profile) {
        const role = profile.role || "user";
        setUser({
          id: profile.id,
          email: email,
          name: profile.name,
          bio: profile.bio || "",
          phone: profile.phone || "",
          location: profile.location || "",
          avatar: profile.avatar || "",
          role,
          createdAt: profile.created_at,
        });
        setSession((current) => current && current.userId === userId ? { ...current, name: profile.name || current.name, role } : current);
      }
      
      getUnreadCount(userId).then(setUnreadMessages).catch(console.error);
    } catch (err) {
      console.error("AuthContext: Erro fatal ao carregar perfil:", err);
    } finally {
      loadingUserIdRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    const { data: { session: supaSession } } = await supabase.auth.getSession();
    const s = buildSession(supaSession);
    setSession(s);
    if (s && supaSession) {
      await loadUserAndUnread(s.userId, supaSession.user.email || "");
    } else {
      setIsLoading(false);
    }
  }, [buildSession, loadUserAndUnread]);

  const refreshUnread = useCallback(() => {
    const currentSession = session;
    if (currentSession) {
      getUnreadCount(currentSession.userId).then(setUnreadMessages);
    }
  }, [session]);

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      try {
        const { data: { session: supaSession } } = await supabase.auth.getSession();
        if (!active) return;
        const s = buildSession(supaSession);
        setSession(s);

        if (s && supaSession) {
          setIsLoading(true);
          await loadUserAndUnread(s.userId, supaSession.user.email || "");
        } else {
          setUser(null);
          setUnreadMessages(0);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("AuthContext: erro ao inicializar sessão:", error);
        if (!active) return;
        setSession(null);
        setUser(null);
        setUnreadMessages(0);
        setIsLoading(false);
      }
    };

    bootstrapSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supaSession) => {
        console.log("AuthContext: Evento Supabase:", event);
        const s = buildSession(supaSession);
        setSession(s);

        if (s && supaSession) {
          setIsLoading(true);
          loadUserAndUnread(s.userId, supaSession.user.email || "");
        } else {
          setUser(null);
          setUnreadMessages(0);
          setIsLoading(false);
        }
      }
    );

    const timeout = setTimeout(() => setIsLoading(false), 8000);

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [buildSession, loadUserAndUnread]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUnreadMessages(0);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, unreadMessages, refreshSession, refreshUnread, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

