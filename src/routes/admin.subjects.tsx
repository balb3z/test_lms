import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/subjects")({
  component: SubjectsGrades,
});

function SubjectsGrades() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await supabase.from("subjects").select("*").order("name_en")).data ?? [],
  });
  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => (await supabase.from("grades").select("*").order("level").order("number")).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name_en: "", name_ar: "", color: "#3B82F6" });

  async function createSubject(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("subjects").insert(form);
    if (error) toast.error(error.message);
    else {
      toast.success(t("done"));
      setForm({ name_en: "", name_ar: "", color: "#3B82F6" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["subjects"] });
    }
  }
  async function delSubject(id: string) {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(t("done")); qc.invalidateQueries({ queryKey: ["subjects"] }); }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("subjects")}</h1>
            <p className="text-sm text-muted-foreground">{lang === "ar" ? "المواد الدراسية المتاحة في النظام" : "Subjects available in the system."}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gradient-brand text-primary-foreground"><Plus className="me-2 h-4 w-4" />{t("add")}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("add")} {t("subject")}</DialogTitle></DialogHeader>
              <form onSubmit={createSubject} className="space-y-3">
                <div><Label>Name (EN)</Label><Input required value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} /></div>
                <div><Label>الاسم (AR)</Label><Input required value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} /></div>
                <div><Label>Color</Label><Input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} /></div>
                <Button type="submit" className="w-full">{t("create")}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects?.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-elegant">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg" style={{ background: s.color }} />
                <div>
                  <div className="font-semibold">{lang === "ar" ? s.name_ar : s.name_en}</div>
                  <div className="text-xs text-muted-foreground">{lang === "ar" ? s.name_en : s.name_ar}</div>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => delSubject(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">{t("grades")}</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {grades?.map((g) => (
            <div key={g.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{lang === "ar" ? g.name_ar : g.name_en}</span>
                <Badge variant="outline">{t(g.level as "primary" | "preparatory")}</Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
