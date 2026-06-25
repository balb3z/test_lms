import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/student/sessions")({
  component: StudentSessionsPage,
});

function StudentSessionsPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();

  const { data: sessions } = useQuery({
    enabled: !!user,
    queryKey: ["student-sessions", user?.id],
    queryFn: async () => (await supabase.from("sessions").select("*, subjects(name_en, name_ar), grades(name_en, name_ar)").order("scheduled_at", { ascending: false })).data ?? [],
  });
  const { data: att } = useQuery({
    enabled: !!user,
    queryKey: ["student-att", user?.id],
    queryFn: async () => (await supabase.from("attendance").select("session_id, status").eq("student_id", user!.id)).data ?? [],
  });

  const attMap = new Map(att?.map((a) => [a.session_id, a.status]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("sessions")}</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {sessions?.map((s) => {
          const status = attMap.get(s.id);
          const upcoming = new Date(s.scheduled_at).getTime() > Date.now() - 60 * 60 * 1000;
          return (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? s.subjects?.name_ar : s.subjects?.name_en} · {lang === "ar" ? s.grades?.name_ar : s.grades?.name_en}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(s.scheduled_at).toLocaleString(lang === "ar" ? "ar-EG" : undefined)} · {s.duration_minutes}m</p>
                </div>
                {status && (
                  <Badge variant={status === "present" ? "default" : status === "late" ? "secondary" : "destructive"}>
                    {status === "present" ? <CheckCircle2 className="me-1 h-3 w-3" /> : status === "late" ? <Clock className="me-1 h-3 w-3" /> : <XCircle className="me-1 h-3 w-3" />}
                    {t(status)}
                  </Badge>
                )}
              </div>
              <a href={s.zoom_url} target="_blank" rel="noopener noreferrer">
                <Button className="mt-4 gradient-brand text-primary-foreground" disabled={!upcoming}>
                  <ExternalLink className="me-2 h-4 w-4" /> {t("enter_meeting")}
                </Button>
              </a>
            </div>
          );
        })}
        {sessions && sessions.length === 0 && <p className="text-muted-foreground">{t("no_data")}</p>}
      </div>
    </div>
  );
}
