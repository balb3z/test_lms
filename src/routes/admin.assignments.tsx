import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { listAllUsers } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/assignments")({
  component: AdminAssignmentsPage,
});

function AdminAssignmentsPage() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const list = useServerFn(listAllUsers);

  const { data: users } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const { data: subjects } = useQuery({ queryKey: ["subjects"], queryFn: async () => (await supabase.from("subjects").select("*").order("name_en")).data ?? [] });
  const { data: grades } = useQuery({ queryKey: ["grades"], queryFn: async () => (await supabase.from("grades").select("*").order("level").order("number")).data ?? [] });
  const { data: ts } = useQuery({
    queryKey: ["teacher_subjects"],
    queryFn: async () => (await supabase.from("teacher_subjects").select("*")).data ?? [],
  });
  const { data: st } = useQuery({
    queryKey: ["student_teachers"],
    queryFn: async () => (await supabase.from("student_teachers").select("*")).data ?? [],
  });

  const teachers = users?.filter((u) => u.roles.includes("teacher")) ?? [];
  const students = users?.filter((u) => u.roles.includes("student")) ?? [];

  const [tsForm, setTsForm] = useState({ teacher_id: "", subject_id: "", grade_id: "" });
  const [stForm, setStForm] = useState({ student_id: "", subject_id: "", teacher_id: "" });

  async function addTs(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("teacher_subjects").insert(tsForm);
    if (error) toast.error(error.message);
    else { toast.success(t("done")); setTsForm({ teacher_id: "", subject_id: "", grade_id: "" }); qc.invalidateQueries({ queryKey: ["teacher_subjects"] }); }
  }
  async function delTs(id: string) {
    const { error } = await supabase.from("teacher_subjects").delete().eq("id", id);
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ["teacher_subjects"] }); }
  }
  async function addSt(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("student_teachers").upsert(stForm, { onConflict: "student_id,subject_id" });
    if (error) toast.error(error.message);
    else { toast.success(t("done")); setStForm({ student_id: "", subject_id: "", teacher_id: "" }); qc.invalidateQueries({ queryKey: ["student_teachers"] }); }
  }
  async function delSt(id: string) {
    const { error } = await supabase.from("student_teachers").delete().eq("id", id);
    if (error) toast.error(error.message); else { qc.invalidateQueries({ queryKey: ["student_teachers"] }); }
  }

  const subjName = (id: string) => {
    const s = subjects?.find((x) => x.id === id);
    return s ? (lang === "ar" ? s.name_ar : s.name_en) : "—";
  };
  const gradeName = (id: string) => {
    const g = grades?.find((x) => x.id === id);
    return g ? (lang === "ar" ? g.name_ar : g.name_en) : "—";
  };
  const userName = (id: string) => users?.find((u) => u.id === id)?.full_name || users?.find((u) => u.id === id)?.email || "—";

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">{t("assignments_mgmt")}</h1>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
        <h2 className="mb-3 text-lg font-semibold">{t("teacher")} → {t("subject")} ({t("grade")})</h2>
        <form onSubmit={addTs} className="grid gap-3 sm:grid-cols-4">
          <Picker placeholder={t("pick_teacher")} value={tsForm.teacher_id} onChange={(v) => setTsForm((f) => ({ ...f, teacher_id: v }))} options={teachers.map((u) => ({ value: u.id, label: u.full_name || u.email }))} />
          <Picker placeholder={t("pick_subject")} value={tsForm.subject_id} onChange={(v) => setTsForm((f) => ({ ...f, subject_id: v }))} options={(subjects ?? []).map((s) => ({ value: s.id, label: lang === "ar" ? s.name_ar : s.name_en }))} />
          <Picker placeholder={t("pick_grade")} value={tsForm.grade_id} onChange={(v) => setTsForm((f) => ({ ...f, grade_id: v }))} options={(grades ?? []).map((g) => ({ value: g.id, label: lang === "ar" ? g.name_ar : g.name_en }))} />
          <Button type="submit" className="gradient-brand text-primary-foreground">{t("assign_teacher")}</Button>
        </form>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-start"><tr><th className="px-3 py-2 text-start">{t("teacher")}</th><th className="px-3 py-2 text-start">{t("subject")}</th><th className="px-3 py-2 text-start">{t("grade")}</th><th /></tr></thead>
            <tbody>
              {ts?.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2">{userName(row.teacher_id)}</td>
                  <td className="px-3 py-2">{subjName(row.subject_id)}</td>
                  <td className="px-3 py-2">{gradeName(row.grade_id)}</td>
                  <td className="px-3 py-2 text-end"><Button variant="ghost" size="icon" onClick={() => delTs(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
              {ts && ts.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">{t("no_data")}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
        <h2 className="mb-3 text-lg font-semibold">{t("student")} → {t("subject")} → {t("teacher")}</h2>
        <form onSubmit={addSt} className="grid gap-3 sm:grid-cols-4">
          <Picker placeholder={t("pick_student")} value={stForm.student_id} onChange={(v) => setStForm((f) => ({ ...f, student_id: v }))} options={students.map((u) => ({ value: u.id, label: u.full_name || u.email }))} />
          <Picker placeholder={t("pick_subject")} value={stForm.subject_id} onChange={(v) => setStForm((f) => ({ ...f, subject_id: v }))} options={(subjects ?? []).map((s) => ({ value: s.id, label: lang === "ar" ? s.name_ar : s.name_en }))} />
          <Picker placeholder={t("pick_teacher")} value={stForm.teacher_id} onChange={(v) => setStForm((f) => ({ ...f, teacher_id: v }))} options={teachers.map((u) => ({ value: u.id, label: u.full_name || u.email }))} />
          <Button type="submit" className="gradient-brand text-primary-foreground">{t("assign_teacher")}</Button>
        </form>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40"><tr><th className="px-3 py-2 text-start">{t("student")}</th><th className="px-3 py-2 text-start">{t("subject")}</th><th className="px-3 py-2 text-start">{t("teacher")}</th><th /></tr></thead>
            <tbody>
              {st?.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2">{userName(row.student_id)}</td>
                  <td className="px-3 py-2">{subjName(row.subject_id)}</td>
                  <td className="px-3 py-2">{userName(row.teacher_id)}</td>
                  <td className="px-3 py-2 text-end"><Button variant="ghost" size="icon" onClick={() => delSt(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                </tr>
              ))}
              {st && st.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">{t("no_data")}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Picker({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
