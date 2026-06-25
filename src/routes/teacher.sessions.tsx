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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ExternalLink, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/teacher/sessions")({
  component: TeacherSessionsPage,
});

function TeacherSessionsPage() {
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
  const { data: sessions } = useQuery({
    enabled: !!user,
    queryKey: ["my-sessions", user?.id],
    queryFn: async () => (await supabase.from("sessions").select("*").eq("teacher_id", user!.id).order("scheduled_at", { ascending: false })).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subject_id: "", grade_id: "", scheduled_at: "", duration_minutes: 45, zoom_url: "" });
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("sessions").insert({
      ...form,
      teacher_id: user!.id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
    });
    if (error) toast.error(error.message);
    else { toast.success(t("done")); setOpen(false); setForm({ title: "", subject_id: "", grade_id: "", scheduled_at: "", duration_minutes: 45, zoom_url: "" }); qc.invalidateQueries({ queryKey: ["my-sessions"] }); }
  }
  async function onDelete(id: string) {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["my-sessions"] });
  }

  const subjName = (id: string) => { const s = subjects?.find((x) => x.id === id); return s ? (lang === "ar" ? s.name_ar : s.name_en) : "—"; };
  const gradeName = (id: string) => { const g = grades?.find((x) => x.id === id); return g ? (lang === "ar" ? g.name_ar : g.name_en) : "—"; };

  const teacherSubjects = (ts ?? []).filter((row) => subjects?.some((s) => s.id === row.subject_id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("sessions")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-primary-foreground"><Plus className="me-2 h-4 w-4" />{t("create_session")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("create_session")}</DialogTitle></DialogHeader>
            <form onSubmit={onCreate} className="space-y-3">
              <div><Label>{t("title")}</Label><Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("subject")}</Label>
                  <Select value={form.subject_id} onValueChange={(v) => setForm((f) => ({ ...f, subject_id: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[...new Set(teacherSubjects.map((r) => r.subject_id))].map((sid) => (
                        <SelectItem key={sid} value={sid}>{subjName(sid)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{t("grade")}</Label>
                  <Select value={form.grade_id} onValueChange={(v) => setForm((f) => ({ ...f, grade_id: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[...new Set(teacherSubjects.filter((r) => !form.subject_id || r.subject_id === form.subject_id).map((r) => r.grade_id))].map((gid) => (
                        <SelectItem key={gid} value={gid}>{gradeName(gid)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("date_time")}</Label><Input type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} /></div>
                <div><Label>{t("duration_min")}</Label><Input type="number" min={5} value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))} /></div>
              </div>
              <div><Label>{t("zoom_url")}</Label><Input type="url" required value={form.zoom_url} onChange={(e) => setForm((f) => ({ ...f, zoom_url: e.target.value }))} /></div>
              <Button type="submit" className="w-full">{t("create")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sessions?.map((s) => (
          <SessionCard key={s.id} session={s} subjName={subjName(s.subject_id)} gradeName={gradeName(s.grade_id)} onDelete={onDelete} t={t} lang={lang} />
        ))}
        {sessions && sessions.length === 0 && <p className="text-muted-foreground">{t("no_data")}</p>}
      </div>
    </div>
  );
}

function SessionCard({ session, subjName, gradeName, onDelete, t, lang }: {
  session: { id: string; title: string; subject_id: string; grade_id: string; scheduled_at: string; duration_minutes: number; zoom_url: string };
  subjName: string; gradeName: string; onDelete: (id: string) => void;
  t: (k: string) => string; lang: string;
}) {
  const [openAtt, setOpenAtt] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{session.title}</h3>
          <p className="text-sm text-muted-foreground">{subjName} · {gradeName}</p>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(session.scheduled_at).toLocaleString(lang === "ar" ? "ar-EG" : undefined)} · {session.duration_minutes}m</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(session.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
      <div className="mt-4 flex gap-2">
        <a href={session.zoom_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <ExternalLink className="me-2 h-4 w-4" /> {t("enter_meeting")}
        </a>
        <Button variant="outline" size="sm" onClick={() => setOpenAtt(true)}><Users className="me-2 h-4 w-4" />{t("mark_attendance")}</Button>
      </div>
      <AttendanceDialog open={openAtt} onOpenChange={setOpenAtt} session={session} t={t} />
    </div>
  );
}

function AttendanceDialog({ open, onOpenChange, session, t }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  session: { id: string; subject_id: string; grade_id: string }; t: (k: string) => string;
}) {
  const qc = useQueryClient();
  const { data: students } = useQuery({
    enabled: open,
    queryKey: ["session-students", session.id],
    queryFn: async () => {
      const { data: st } = await supabase.from("student_teachers").select("student_id").eq("subject_id", session.subject_id);
      const studentIds = (st ?? []).map((x) => x.student_id);
      if (studentIds.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email, grade_id").in("id", studentIds).eq("grade_id", session.grade_id);
      const { data: att } = await supabase.from("attendance").select("student_id, status").eq("session_id", session.id);
      const map = new Map(att?.map((a) => [a.student_id, a.status]));
      return (profiles ?? []).map((p) => ({ ...p, status: (map.get(p.id) ?? "absent") as "present" | "absent" | "late" }));
    },
  });

  async function setStatus(student_id: string, status: "present" | "absent" | "late") {
    const { error } = await supabase.from("attendance").upsert(
      { session_id: session.id, student_id, status },
      { onConflict: "session_id,student_id" },
    );
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["session-students", session.id] });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("mark_attendance")}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {students?.length === 0 && <p className="text-sm text-muted-foreground">{t("no_data")}</p>}
          {students?.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">{s.full_name || s.email}</div>
                <Badge variant="outline" className="mt-1 text-xs">{t(s.status)}</Badge>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant={s.status === "present" ? "default" : "outline"} onClick={() => setStatus(s.id, "present")}>{t("present")}</Button>
                <Button size="sm" variant={s.status === "late" ? "default" : "outline"} onClick={() => setStatus(s.id, "late")}>{t("late")}</Button>
                <Button size="sm" variant={s.status === "absent" ? "default" : "outline"} onClick={() => setStatus(s.id, "absent")}>{t("absent")}</Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
