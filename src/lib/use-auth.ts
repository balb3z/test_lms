import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "admin" | "teacher" | "student";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  locale: string;
  grade_id: string | null;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: Role[];
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null, session: null, profile: null, roles: [], loading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function hydrate(session: Session | null) {
      if (!session?.user) {
        if (mounted) setState({ user: null, session: null, profile: null, roles: [], loading: false });
        return;
      }
      const [{ data: profile }, { data: rolesData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
      ]);
      if (!mounted) return;
      setState({
        user: session.user,
        session,
        profile: (profile as Profile | null) ?? null,
        roles: (rolesData?.map((r: { role: Role }) => r.role) ?? []) as Role[],
        loading: false,
      });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // defer to avoid recursion
      setTimeout(() => hydrate(session), 0);
    });

    supabase.auth.getSession().then(({ data }) => hydrate(data.session));

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}

export function primaryRole(roles: Role[]): Role | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("teacher")) return "teacher";
  if (roles.includes("student")) return "student";
  return null;
}
