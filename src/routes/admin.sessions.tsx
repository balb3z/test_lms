import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { listAllUsers } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ExternalLink, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/sessions")({
  component: AdminSessionsPage,
});

function AdminSessionsPage() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const list = useServerFn(listAllUsers);

  const { data: users } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const { data: subjects } = useQuery({ queryKey: ["subjects"], queryFn: async () => (await supabase.from("subjects").select("*").order("name_en")).data ?? [] });
  const { data: grades } = useQuery({ queryKey: ["grades"], queryFn: async () => (await supabase.from("grades").select("*").order("level").order("number")).data ?? [] });
  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await supabase.from("sessions").select("*").order("scheduled_at", { ascending: false })).data ?? [],
  });
  const teachers = users?.filter((u) => u.roles.includes("teacher")) ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", teacher_id: "", subject_id: "", grade_id: "", zoom_url: "", scheduled_at: "", duration_minutes: 45 });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("sessions").insert({
      ...form,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
    });
    if (error) toast.error(error.message);
    else { toast.success(t("done")); setOpen(false); setForm({ title: "", teacher_id: "", subject_id: "", grade_id: "", zoom_url: "", scheduled_at: "", duration_minutes: 45 }); qc.invalidateQueries({ queryKey: ["sessions"] }); }
  }
  async function onDelete(id: string) {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["sessions"] });
  }

  const subjName = (id: string) => { const s = subjects?.find((x) => x.id === id); return s ? (lang === "ar" ? s.name_ar : s.name_en) : "—"; };
  const gradeName = (id: string) => { const g = grades?.find((x) => x.id === id); return g ? (lang === "ar" ? g.name_ar : g.name_en) : "—"; };
  const userName = (id: string) => users?.find((u) => u.id === id)?.full_name || "—";

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
                <div><Label>{t("teacher")}</Label>
                  <Select value={form.teacher_id} onValueChange={(v) => setForm((f) => ({ ...f, teacher_id: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{teachers.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>{t("subject")}</Label>
                  <Select value={form.subject_id} onValueChange={(v) => setForm((f) => ({ ...f, subject_id: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{subjects?.map((s) => <SelectItem key={s.id} value={s.id}>{lang === "ar" ? s.name_ar : s.name_en}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("grade")}</Label>
                  <Select value={form.grade_id} onValueChange={(v) => setForm((f) => ({ ...f, grade_id: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{grades?.map((g) => <SelectItem key={g.id} value={g.id}>{lang === "ar" ? g.name_ar : g.name_en}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>{t("duration_min")}</Label><Input type="number" min={5} value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))} /></div>
              </div>
              <div><Label>{t("date_time")}</Label><Input type="datetime-local" required value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} /></div>
              <div><Label>{t("zoom_url")}</Label><Input type="url" required placeholder="https://zoom.us/j/..." value={form.zoom_url} onChange={(e) => setForm((f) => ({ ...f, zoom_url: e.target.value }))} /></div>
              <Button type="submit" className="w-full">{t("create")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sessions?.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{subjName(s.subject_id)} · {gradeName(s.grade_id)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{userName(s.teacher_id)} · {new Date(s.scheduled_at).toLocaleString(lang === "ar" ? "ar-EG" : undefined)} · {s.duration_minutes}m</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            <a href={s.zoom_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <ExternalLink className="me-2 h-4 w-4" /> {t("enter_meeting")}
            </a>
          </div>
        ))}
        {sessions && sessions.length === 0 && <p className="text-muted-foreground">{t("no_data")}</p>}
      </div>
    </div>
  );
}
