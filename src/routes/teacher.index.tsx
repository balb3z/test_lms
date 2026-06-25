import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/teacher/")({
  component: TeacherOverview,
});

function TeacherOverview() {
  const { user } = useAuth();
  const { t, lang } = useI18n();

  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["teacher-overview", user?.id],
    queryFn: async () => {
      const [ts, st, sess] = await Promise.all([
        supabase.from("teacher_subjects").select("id, subject_id, grade_id, subjects(name_en, name_ar, color), grades(name_en, name_ar, level)").eq("teacher_id", user!.id),
        supabase.from("student_teachers").select("student_id, subject_id").eq("teacher_id", user!.id),
        supabase.from("sessions").select("id").eq("teacher_id", user!.id),
      ]);
      return { ts: ts.data ?? [], st: st.data ?? [], sessCount: sess.data?.length ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("overview")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={t("my_subjects")} value={data?.ts.length ?? "—"} />
        <Stat label={t("students")} value={new Set(data?.st.map((x) => x.student_id)).size || "—"} />
        <Stat label={t("sessions")} value={data?.sessCount ?? "—"} />
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">{t("my_subjects")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.ts.map((row) => (
            <div key={row.id} className="rounded-2xl border border-border bg-card p-4 shadow-elegant">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg" style={{ background: row.subjects?.color ?? "#3B82F6" }} />
                <div>
                  <div className="font-semibold">{lang === "ar" ? row.subjects?.name_ar : row.subjects?.name_en}</div>
                  <div className="text-xs text-muted-foreground">{lang === "ar" ? row.grades?.name_ar : row.grades?.name_en}</div>
                </div>
              </div>
              <Badge variant="secondary" className="mt-3">{t(row.grades?.level as "primary" | "preparatory")}</Badge>
            </div>
          ))}
          {data?.ts.length === 0 && <p className="text-muted-foreground">{t("no_data")}</p>}
        </div>
      </div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
