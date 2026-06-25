import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useI18n } from "@/lib/i18n";
import { useAuth, primaryRole } from "@/lib/use-auth";
import { LayoutDashboard, Users, BookMarked, Link2, Video } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { t } = useI18n();
  const { user, roles, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) nav({ to: "/auth" });
    else if (!roles.includes("admin")) {
      const r = primaryRole(roles);
      if (r === "teacher") nav({ to: "/teacher" });
      else if (r === "student") nav({ to: "/student" });
    }
  }, [user, roles, loading, nav]);

  const items = [
    { to: "/admin", label: t("overview"), icon: LayoutDashboard },
    { to: "/admin/users", label: t("users"), icon: Users },
    { to: "/admin/subjects", label: `${t("subjects")} / ${t("grades")}`, icon: BookMarked },
    { to: "/admin/assignments", label: t("assignments_mgmt"), icon: Link2 },
    { to: "/admin/sessions", label: t("sessions"), icon: Video },
  ];
  return <DashboardLayout role="admin" items={items}><Outlet /></DashboardLayout>;
}
