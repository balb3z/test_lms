import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useI18n } from "@/lib/i18n";
import { useAuth, primaryRole } from "@/lib/use-auth";
import { LayoutDashboard, Video, BookOpen, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/teacher")({
  component: TeacherLayout,
});

function TeacherLayout() {
  const { t } = useI18n();
  const { user, roles, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) nav({ to: "/auth" });
    else if (!roles.includes("teacher")) {
      const r = primaryRole(roles);
      if (r === "admin") nav({ to: "/admin" });
      else if (r === "student") nav({ to: "/student" });
    }
  }, [user, roles, loading, nav]);
  const items = [
    { to: "/teacher", label: t("overview"), icon: LayoutDashboard },
    { to: "/teacher/sessions", label: t("sessions"), icon: Video },
    { to: "/teacher/materials", label: t("materials"), icon: BookOpen },
    { to: "/teacher/assignments", label: t("assignments"), icon: ClipboardList },
  ];
  return <DashboardLayout role="teacher" items={items}><Outlet /></DashboardLayout>;
}
