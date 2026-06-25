import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole } from "@/lib/use-auth";
import { useI18n } from "@/lib/i18n";
import { bootstrapDefaultAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Languages } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Madrasa LMS" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, roles, loading } = useAuth();
  const nav = useNavigate();
  const { t, lang, setLang } = useI18n();
  const bootstrap = useServerFn(bootstrapDefaultAdmin);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const r = primaryRole(roles);
    if (r === "admin") nav({ to: "/admin" });
    else if (r === "teacher") nav({ to: "/teacher" });
    else if (r === "student") nav({ to: "/student" });
    else nav({ to: "/" });
  }, [user, roles, loading, nav]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(t("done"));
  }

  async function signInGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  }

  async function initAdmin() {
    setBusy(true);
    try {
      const r = await bootstrap();
      if (r.ok) {
        toast.success(`Admin: ${r.email} / ${r.password}`);
        setEmail(r.email);
        setPassword(r.password);
      } else {
        toast.info(r.message);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <aside className="hidden gradient-brand md:flex md:flex-col md:justify-between md:p-10 md:text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">{t("app_name")}</span>
        </div>
        <div>
          <h2 className="text-balance text-4xl font-bold leading-tight">
            {lang === "ar" ? "تعليم منظّم لكل صف ومادة." : "Structured learning for every grade & subject."}
          </h2>
          <p className="mt-3 max-w-md text-white/80">
            {lang === "ar"
              ? "مدير، معلم وطالب — لوحات منفصلة، حصص زووم، حضور وواجبات."
              : "Admin, teacher, student dashboards — Zoom classes, attendance, assignments."}
          </p>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} Madrasa LMS</p>
      </aside>

      <div className="flex flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t("sign_in")}</h1>
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
              <Languages className="me-1 h-4 w-4" /> {lang === "en" ? "العربية" : "EN"}
            </Button>
          </div>

          <Button variant="outline" className="w-full" onClick={signInGoogle}>
            {t("google")}
          </Button>
          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> {t("or")} <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={signIn} className="space-y-3">
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full gradient-brand text-primary-foreground" disabled={busy}>
              {t("sign_in")}
            </Button>
          </form>

          <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="mb-2">{t("default_admin_hint")}</p>
            <Button variant="secondary" size="sm" onClick={initAdmin} disabled={busy} className="w-full">
              {t("init_admin")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
