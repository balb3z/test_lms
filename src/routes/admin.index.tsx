import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Users, GraduationCap, BookMarked, Video } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{className?:string}>; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function AdminOverview() {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [students, teachers, subjects, sessions] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase.from("sessions").select("id", { count: "exact", head: true }),
      ]);
      return {
        students: students.count ?? 0,
        teachers: teachers.count ?? 0,
        subjects: subjects.count ?? 0,
        sessions: sessions.count ?? 0,
      };
    },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("overview")}</h1>
        <p className="text-sm text-muted-foreground">{t("app_name")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={GraduationCap} label={t("total_students")} value={data?.students ?? "—"} color="bg-primary/10 text-primary" />
        <StatCard icon={Users} label={t("total_teachers")} value={data?.teachers ?? "—"} color="bg-accent text-accent-foreground" />
        <StatCard icon={BookMarked} label={t("total_subjects")} value={data?.subjects ?? "—"} color="bg-success/15 text-success" />
        <StatCard icon={Video} label={t("total_sessions")} value={data?.sessions ?? "—"} color="bg-warning/15 text-warning" />
      </div>
    </div>
  );
}
