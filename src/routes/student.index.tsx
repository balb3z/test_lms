import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/student/")({
  component: StudentOverview,
});

function StudentOverview() {
  const { user, profile } = useAuth();
  const { t, lang } = useI18n();

  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["student-overview", user?.id, profile?.grade_id],
    queryFn: async () => {
      const gradeRes = profile?.grade_id
        ? await supabase.from("grades").select("*").eq("id", profile.grade_id).maybeSingle()
        : { data: null };
      const { data: st } = await supabase
        .from("student_teachers")
        .select("subject_id, teacher_id, subjects(name_en, name_ar, color)")
        .eq("student_id", user!.id);
      const teacherIds = [...new Set((st ?? []).map((r) => r.teacher_id))];
      const { data: teachers } = teacherIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", teacherIds)
        : { data: [] };
      const rows = (st ?? []).map((r) => ({
        ...r,
        teacher: teachers?.find((tt) => tt.id === r.teacher_id) ?? null,
      }));
      return { grade: gradeRes.data, st: rows };
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("overview")}</h1>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
        <p className="text-sm text-muted-foreground">{t("my_grade")}</p>
        <p className="mt-1 text-2xl font-bold">{data?.grade ? (lang === "ar" ? data.grade.name_ar : data.grade.name_en) : "—"}</p>
        {data?.grade && <Badge variant="secondary" className="mt-2">{t(data.grade.level as "primary" | "preparatory")}</Badge>}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t("my_subjects")} & {t("my_teachers")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.st.map((row) => (
            <div key={row.subject_id} className="rounded-2xl border border-border bg-card p-4 shadow-elegant">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg" style={{ background: row.subjects?.color ?? "#3B82F6" }} />
                <div>
                  <div className="font-semibold">{lang === "ar" ? row.subjects?.name_ar : row.subjects?.name_en}</div>
                  <div className="text-xs text-muted-foreground">{t("teacher")}: {row.teacher?.full_name || row.teacher?.email || "—"}</div>
                </div>
              </div>
            </div>
          ))}
          {data?.st.length === 0 && <p className="text-muted-foreground">{t("no_data")}</p>}
        </div>
      </div>
    </div>
  );
}
