import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useI18n } from "@/lib/i18n";
import { useAuth, primaryRole } from "@/lib/use-auth";
import { LayoutDashboard, Video, BookOpen, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});

function StudentLayout() {
  const { t } = useI18n();
  const { user, roles, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) nav({ to: "/auth" });
    else if (!roles.includes("student")) {
      const r = primaryRole(roles);
      if (r === "admin") nav({ to: "/admin" });
      else if (r === "teacher") nav({ to: "/teacher" });
    }
  }, [user, roles, loading, nav]);
  const items = [
    { to: "/student", label: t("overview"), icon: LayoutDashboard },
    { to: "/student/sessions", label: t("sessions"), icon: Video },
    { to: "/student/materials", label: t("materials"), icon: BookOpen },
    { to: "/student/assignments", label: t("assignments"), icon: ClipboardList },
  ];
  return <DashboardLayout role="student" items={items}><Outlet /></DashboardLayout>;
}
