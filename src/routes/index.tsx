import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, primaryRole } from "@/lib/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { GraduationCap, Languages, Video, BookOpen, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Madrasa LMS — School Learning Management" },
      { name: "description", content: "A modern bilingual School LMS for primary and preparatory students." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, roles, loading } = useAuth();
  const { t, lang, setLang } = useI18n();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    const r = primaryRole(roles);
    if (r === "admin") nav({ to: "/admin" });
    else if (r === "teacher") nav({ to: "/teacher" });
    else if (r === "student") nav({ to: "/student" });
  }, [user, roles, loading, nav]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">{t("app_name")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
              <Languages className="h-4 w-4 me-2" /> {lang === "en" ? "العربية" : "English"}
            </Button>
            <Link to="/auth"><Button>{t("sign_in")}</Button></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="text-center">
          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl">
            {t("tagline")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
            {lang === "ar"
              ? "منصة متكاملة لإدارة الصفوف، المعلمين، الطلاب، حصص زووم، الواجبات والحضور."
              : "A complete platform for managing grades, teachers, students, Zoom classes, assignments, and attendance."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="gradient-brand text-primary-foreground shadow-elegant">{t("sign_in")}</Button></Link>
          </div>
        </section>

        <section className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            { icon: Video, en: "Live Zoom classes", ar: "حصص زووم مباشرة", d_en: "One-click join from a student's dashboard.", d_ar: "انضم بنقرة واحدة من لوحة الطالب." },
            { icon: BookOpen, en: "Subjects & grades", ar: "المواد والصفوف", d_en: "Primary 1–6 and Preparatory 1–3, with per-grade subjects.", d_ar: "ابتدائي ١-٦ وإعدادي ١-٣ مع مواد لكل صف." },
            { icon: ClipboardCheck, en: "Attendance & assignments", ar: "الحضور والواجبات", d_en: "Teachers mark attendance and grade submissions.", d_ar: "يسجل المعلمون الحضور ويقيّمون الواجبات." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{lang === "ar" ? f.ar : f.en}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{lang === "ar" ? f.d_ar : f.d_en}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
