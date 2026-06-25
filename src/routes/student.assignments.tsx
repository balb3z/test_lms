import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/student/assignments")({
  component: StudentAssignmentsPage,
});

function StudentAssignmentsPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const qc = useQueryClient();

  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["student-assignments", user?.id],
    queryFn: async () => {
      const { data: as } = await supabase.from("assignments").select("*, subjects(name_en, name_ar)").order("created_at", { ascending: false });
      const { data: subs } = await supabase.from("submissions").select("*").eq("student_id", user!.id);
      return (as ?? []).map((a) => ({ ...a, submission: subs?.find((s) => s.assignment_id === a.id) ?? null }));
    },
  });

  const [openFor, setOpenFor] = useState<string | null>(null);
  const current = data?.find((x) => x.id === openFor);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("assignments")}</h1>
      <div className="space-y-3">
        {data?.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{lang === "ar" ? a.subjects?.name_ar : a.subjects?.name_en} · {t("max_score")}: {a.max_score}{a.due_at ? ` · ${t("due_at")}: ${new Date(a.due_at).toLocaleString(lang === "ar" ? "ar-EG" : undefined)}` : ""}</p>
                {a.description && <p className="mt-2 text-sm">{a.description}</p>}
                {a.submission?.score != null && <p className="mt-2 text-sm font-medium text-success">{t("score")}: {a.submission.score} / {a.max_score}{a.submission.feedback ? ` — ${a.submission.feedback}` : ""}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                {a.submission ? <Badge>{t("submitted")}</Badge> : <Badge variant="outline">{t("not_submitted")}</Badge>}
                <Button size="sm" variant="outline" onClick={() => setOpenFor(a.id)}>{a.submission ? t("edit") : t("submit")}</Button>
              </div>
            </div>
          </div>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">{t("no_data")}</p>}
      </div>

      {current && (
        <SubmitDialog
          open={!!openFor}
          onOpenChange={(o) => !o && setOpenFor(null)}
          assignmentId={current.id}
          existing={current.submission}
          onDone={() => { setOpenFor(null); qc.invalidateQueries({ queryKey: ["student-assignments"] }); }}
          t={t}
        />
      )}
    </div>
  );
}

function SubmitDialog({ open, onOpenChange, assignmentId, existing, onDone, t }: { open: boolean; onOpenChange: (o: boolean) => void; assignmentId: string; existing: { id: string; content: string | null; file_url: string | null } | null; onDone: () => void; t: (k: string) => string }) {
  const { user } = useAuth();
  const [content, setContent] = useState(existing?.content ?? "");
  const [fileUrl, setFileUrl] = useState(existing?.file_url ?? "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = { assignment_id: assignmentId, student_id: user!.id, content: content || null, file_url: fileUrl || null, submitted_at: new Date().toISOString() };
    const { error } = await supabase.from("submissions").upsert(payload, { onConflict: "assignment_id,student_id" });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(t("done")); onDone(); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("submission")}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div><Label>{t("content")}</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} /></div>
          <div><Label>{t("url")} ({t("link")})</Label><Input type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} /></div>
          <Button type="submit" disabled={busy} className="w-full">{t("submit")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
