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
import { Plus, Trash2, ExternalLink, FileText, Video, StickyNote, Link2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type MaterialType = Database["public"]["Enums"]["material_type"];

export const Route = createFileRoute("/teacher/materials")({
  component: TeacherMaterialsPage,
});

const ICONS: Record<MaterialType, React.ComponentType<{ className?: string }>> = {
  pdf: FileText, video: Video, note: StickyNote, link: Link2,
};

function TeacherMaterialsPage() {
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
  const { data: materials } = useQuery({
    enabled: !!user,
    queryKey: ["my-materials", user?.id],
    queryFn: async () => (await supabase.from("materials").select("*").eq("teacher_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject_id: "", grade_id: "", type: "pdf" as MaterialType, url: "", content: "" });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("materials").insert({ ...form, teacher_id: user!.id });
    if (error) toast.error(error.message);
    else { toast.success(t("done")); setOpen(false); setForm({ title: "", description: "", subject_id: "", grade_id: "", type: "pdf", url: "", content: "" }); qc.invalidateQueries({ queryKey: ["my-materials"] }); }
  }
  async function onDelete(id: string) {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["my-materials"] });
  }

  const subjName = (id: string) => { const s = subjects?.find((x) => x.id === id); return s ? (lang === "ar" ? s.name_ar : s.name_en) : "—"; };
  const gradeName = (id: string) => { const g = grades?.find((x) => x.id === id); return g ? (lang === "ar" ? g.name_ar : g.name_en) : "—"; };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("materials")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-brand text-primary-foreground"><Plus className="me-2 h-4 w-4" />{t("create_material")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("create_material")}</DialogTitle></DialogHeader>
            <form onSubmit={onCreate} className="space-y-3">
              <div><Label>{t("title")}</Label><Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
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
              <div><Label>{t("type")}</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as MaterialType }))}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">{t("pdf")}</SelectItem>
                    <SelectItem value="video">{t("video")}</SelectItem>
                    <SelectItem value="note">{t("note")}</SelectItem>
                    <SelectItem value="link">{t("link")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type === "note"
                ? <div><Label>{t("content")}</Label><Textarea required value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} /></div>
                : <div><Label>{t("url")}</Label><Input type="url" required value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} /></div>}
              <div><Label>{t("description")}</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              <Button type="submit" className="w-full">{t("create")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {materials?.map((m) => {
          const Icon = ICONS[m.type];
          return (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></div>
                  <div>
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{subjName(m.subject_id)} · {gradeName(m.grade_id)}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDelete(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              {m.description && <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>}
              {m.type === "note"
                ? <p className="mt-2 text-sm whitespace-pre-wrap">{m.content}</p>
                : m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center text-sm text-primary hover:underline"><ExternalLink className="me-1 h-3 w-3" />{t("link")}</a>}
            </div>
          );
        })}
        {materials && materials.length === 0 && <p className="text-muted-foreground">{t("no_data")}</p>}
      </div>
    </div>
  );
}
