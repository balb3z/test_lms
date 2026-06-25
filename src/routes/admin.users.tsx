import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createSchoolUser, deleteSchoolUser, listAllUsers } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const list = useServerFn(listAllUsers);
  const create = useServerFn(createSchoolUser);
  const del = useServerFn(deleteSchoolUser);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
  });
  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => (await supabase.from("grades").select("*").order("level").order("number")).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "student" as "teacher" | "student", grade_id: "" });
  const [busy, setBusy] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        grade_id: form.role === "student" ? form.grade_id || null : null,
      } });
      toast.success(t("done"));
      setOpen(false);
      setForm({ full_name: "", email: "", password: "", role: "student", grade_id: "" });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }

  async function onDelete(uid: string) {
    if (!confirm("Delete this user?")) return;
    try {
      await del({ data: { user_id: uid } });
      toast.success(t("done"));
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("users")}</h1>
          <p className="text-sm text-muted-foreground">{t("teachers")} & {t("students")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground"><Plus className="me-2 h-4 w-4" /> {t("create_user")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("create_user")}</DialogTitle></DialogHeader>
            <form onSubmit={onCreate} className="space-y-3">
              <div><Label>{t("full_name")}</Label><Input required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} /></div>
              <div><Label>{t("email")}</Label><Input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>{t("password")}</Label><Input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
              <div>
                <Label>{t("role")}</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as "teacher" | "student" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">{t("teacher")}</SelectItem>
                    <SelectItem value="student">{t("student")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.role === "student" && (
                <div>
                  <Label>{t("grade")}</Label>
                  <Select value={form.grade_id} onValueChange={(v) => setForm((f) => ({ ...f, grade_id: v }))}>
                    <SelectTrigger><SelectValue placeholder={t("pick_grade")} /></SelectTrigger>
                    <SelectContent>
                      {grades?.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{lang === "ar" ? g.name_ar : g.name_en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" disabled={busy} className="w-full">{t("create")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-start">
            <tr>
              <th className="px-4 py-3 text-start">{t("full_name")}</th>
              <th className="px-4 py-3 text-start">{t("email")}</th>
              <th className="px-4 py-3 text-start">{t("role")}</th>
              <th className="px-4 py-3 text-start">{t("grade")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{t("loading")}</td></tr>}
            {users?.map((u) => {
              const g = grades?.find((x) => x.id === u.grade_id);
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">{u.roles.map((r) => <Badge key={r} variant="secondary" className="me-1">{t(r as "admin" | "teacher" | "student")}</Badge>)}</td>
                  <td className="px-4 py-3">{g ? (lang === "ar" ? g.name_ar : g.name_en) : "—"}</td>
                  <td className="px-4 py-3 text-end">
                    {!u.roles.includes("admin") && (
                      <Button size="icon" variant="ghost" onClick={() => onDelete(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {users && users.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{t("no_data")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
