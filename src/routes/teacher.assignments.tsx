import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/teacher/assignments")({
  component: TeacherAssignmentsPage,
});

function TeacherAssignmentsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: ts } = useQuery({
    enabled: !!user,
    queryKey: ["my-ts", user?.id],
    queryFn: async () => (await supabase.from("teacher_subjects").select("subject_id, grade_id").eq("teacher_id", user!.id)).data ?? [],
  });
  const { data: subjects } = useQuery({ queryKey: ["subjects"], queryFn: async () => (await supabase.from("subjects").select("*")).data ?? [] });
  const { data: grades } = useQuery({ queryKey: ["grades"], queryFn: async () => (await supabase.from("grades").select("*")).data ?? [] });
  const { data: assignments } = useQuery({
    enabled: !!user,
    queryKey: ["my-assignments", user?.id],
    queryFn: async () => (await supabase.from("assignments").select("*").eq("teacher_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject_id: "", grade_id: "", due_at: "", max_score: 100 });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("assignments").insert({
      ...form,
      teacher_id: user!.id,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
    });
    if (error) toast.error(error.message);
    else { toast.success(t("done")); setOpen(false); setForm({ title: "", description: "", subject_id: "", grade_id: "", due_at: "", max_score: 100 }); qc.invalidateQueries({ queryKey: ["my-assignments"] }); }
  }
  async function onDelete(id: string) {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["my-assignments"] });
  }

  const subjName = (id: string) => { const s = subjects?.find((x) => x.id === id); return s ? (lang === "ar" ? s.name_ar : s.name_en) : "—"; };
  const gradeName = (id: string) => { const g = grades?.find((x) => x.id === id); return g ? (lang === "ar" ? g.name_ar : g.name_en) : "—"; };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("assignments")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-primary-foreground"><Plus className="me-2 h-4 w-4" />{t("create_assignment")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("create_assignment")}</DialogTitle></DialogHeader>
            <form onSubmit={onCreate} className="space-y-3">
              <div><Label>{t("title")}</Label><Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>{t("description")}</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("subject")}</Label>
                  <Select value={form.subject_id} onValueChange={(v) => setForm((f) => ({ ...f, subject_id: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[...new Set((ts ?? []).map((r) => r.subject_id))].map((sid) => <SelectItem key={sid} value={sid}>{subjName(sid)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>{t("grade")}</Label>
                  <Select value={form.grade_id} onValueChange={(v) => setForm((f) => ({ ...f, grade_id: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[...new Set((ts ?? []).filter((r) => !form.subject_id || r.subject_id === form.subject_id).map((r) => r.grade_id))].map((gid) => <SelectItem key={gid} value={gid}>{gradeName(gid)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("due_at")}</Label><Input type="datetime-local" value={form.due_at} onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))} /></div>
                <div><Label>{t("max_score")}</Label><Input type="number" value={form.max_score} onChange={(e) => setForm((f) => ({ ...f, max_score: Number(e.target.value) }))} /></div>
              </div>
              <Button type="submit" className="w-full">{t("create")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {assignments?.map((a) => (
          <AssignmentRow key={a.id} a={a} subjName={subjName(a.subject_id)} gradeName={gradeName(a.grade_id)} onDelete={onDelete} t={t} lang={lang} />
        ))}
        {assignments && assignments.length === 0 && <p className="text-muted-foreground">{t("no_data")}</p>}
      </div>
    </div>
  );
}

function AssignmentRow({ a, subjName, gradeName, onDelete, t, lang }: { a: { id: string; title: string; description: string | null; due_at: string | null; max_score: number }; subjName: string; gradeName: string; onDelete: (id: string) => void; t: (k: string) => string; lang: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{a.title}</h3>
          <p className="text-sm text-muted-foreground">{subjName} · {gradeName} · {t("max_score")}: {a.max_score}{a.due_at ? ` · ${t("due_at")}: ${new Date(a.due_at).toLocaleString(lang === "ar" ? "ar-EG" : undefined)}` : ""}</p>
          {a.description && <p className="mt-2 text-sm">{a.description}</p>}
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>{t("submission")}s</Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>
      <SubmissionsDialog open={open} onOpenChange={setOpen} assignmentId={a.id} maxScore={a.max_score} t={t} />
    </div>
  );
}

function SubmissionsDialog({ open, onOpenChange, assignmentId, maxScore, t }: { open: boolean; onOpenChange: (o: boolean) => void; assignmentId: string; maxScore: number; t: (k: string) => string }) {
  const qc = useQueryClient();
  const { data: subs } = useQuery({
    enabled: open,
    queryKey: ["subs", assignmentId],
    queryFn: async () => {
      const { data } = await supabase.from("submissions").select("*").eq("assignment_id", assignmentId);
      const ids = (data ?? []).map((s) => s.student_id);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      return (data ?? []).map((s) => ({ ...s, student: profs?.find((p) => p.id === s.student_id) }));
    },
  });
  async function grade(id: string, score: number, feedback: string) {
    const { error } = await supabase.from("submissions").update({ score, feedback, graded_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(t("done")); qc.invalidateQueries({ queryKey: ["subs", assignmentId] }); }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{t("submission")}s</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {(!subs || subs.length === 0) && <p className="text-sm text-muted-foreground">{t("no_data")}</p>}
          {subs?.map((s) => <SubmissionItem key={s.id} sub={s} maxScore={maxScore} onGrade={grade} t={t} />)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SubmissionItem({ sub, maxScore, onGrade, t }: { sub: { id: string; content: string | null; file_url: string | null; score: number | null; feedback: string | null; student?: { full_name: string; email: string } }; maxScore: number; onGrade: (id: string, score: number, feedback: string) => void; t: (k: string) => string }) {
  const [score, setScore] = useState<number>(sub.score ?? 0);
  const [fb, setFb] = useState(sub.feedback ?? "");
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-sm font-medium">{sub.student?.full_name || sub.student?.email}</div>
      {sub.content && <p className="mt-1 text-sm whitespace-pre-wrap">{sub.content}</p>}
      {sub.file_url && <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{sub.file_url}</a>}
      <div className="mt-2 flex items-end gap-2">
        <div className="w-24"><Label className="text-xs">{t("score")} / {maxScore}</Label><Input type="number" max={maxScore} value={score} onChange={(e) => setScore(Number(e.target.value))} /></div>
        <div className="flex-1"><Label className="text-xs">{t("feedback")}</Label><Input value={fb} onChange={(e) => setFb(e.target.value)} /></div>
        <Button size="sm" onClick={() => onGrade(sub.id, score, fb)}>{t("grade_btn")}</Button>
      </div>
    </div>
  );
}
