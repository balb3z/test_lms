import { type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, type Role } from "@/lib/use-auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, Languages, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardLayout({
  role,
  items,
  children,
}: {
  role: Role;
  items: NavItem[];
  children: ReactNode;
}) {
  const { user, profile, loading, roles } = useAuth();
  const nav = useNavigate();
  const { t, lang, setLang } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">{t("loading")}</div>;
  }
  if (!user) {
    if (typeof window !== "undefined") nav({ to: "/auth" });
    return null;
  }
  if (!roles.includes(role)) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="mt-1 text-sm text-muted-foreground">You don't have the {role} role.</p>
          <Button className="mt-4" onClick={() => nav({ to: "/" })}>Home</Button>
        </div>
      </div>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-40 w-64 -translate-x-full bg-sidebar text-sidebar-foreground transition-transform md:relative md:translate-x-0",
          open && "translate-x-0",
          lang === "ar" && "translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold">{t("app_name")}</div>
            <div className="text-xs text-sidebar-foreground/60">{t(role)}</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-sidebar-border p-3">
          <div className="mb-2 truncate px-2 text-xs text-sidebar-foreground/60">
            {profile?.full_name || user.email}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={signOut}>
            <LogOut className="me-2 h-4 w-4" /> {t("sign_out")}
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((o) => !o)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold">{t("dashboard")}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
            <Languages className="me-1 h-4 w-4" /> {lang === "en" ? "العربية" : "EN"}
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
