import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useI18n } from "@/lib/i18n";
import { ExternalLink, FileText, Video, StickyNote, Link2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type MaterialType = Database["public"]["Enums"]["material_type"];
const ICONS: Record<MaterialType, React.ComponentType<{ className?: string }>> = { pdf: FileText, video: Video, note: StickyNote, link: Link2 };

export const Route = createFileRoute("/student/materials")({
  component: StudentMaterialsPage,
});

function StudentMaterialsPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();

  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["student-materials", user?.id],
    queryFn: async () => (await supabase.from("materials").select("*, subjects(name_en, name_ar, color), grades(name_en, name_ar)").order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("materials")}</h1>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((m) => {
          const Icon = ICONS[m.type];
          return (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: m.subjects?.color }}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{lang === "ar" ? m.subjects?.name_ar : m.subjects?.name_en} · {lang === "ar" ? m.grades?.name_ar : m.grades?.name_en}</div>
                </div>
              </div>
              {m.description && <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>}
              {m.type === "note"
                ? <p className="mt-2 text-sm whitespace-pre-wrap">{m.content}</p>
                : m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center text-sm text-primary hover:underline"><ExternalLink className="me-1 h-3 w-3" />{t("link")}</a>}
            </div>
          );
        })}
        {data && data.length === 0 && <p className="text-muted-foreground">{t("no_data")}</p>}
      </div>
    </div>
  );
}
