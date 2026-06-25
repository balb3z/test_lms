import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_ADMIN_EMAIL = "admin@school.local";
const DEFAULT_ADMIN_PASSWORD = "Admin@12345";

// Public — only works when NO admin exists yet.
export const bootstrapDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error: cErr } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (cErr) throw new Error(cErr.message);
  if ((count ?? 0) > 0) {
    return { ok: false, message: "Admin already exists" } as const;
  }
  const { data: created, error: cuErr } = await supabaseAdmin.auth.admin.createUser({
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "School Admin" },
  });
  if (cuErr || !created.user) throw new Error(cuErr?.message ?? "Failed to create admin");

  await supabaseAdmin.from("profiles").upsert({
    id: created.user.id,
    full_name: "School Admin",
    email: DEFAULT_ADMIN_EMAIL,
  });
  const { error: rErr } = await supabaseAdmin.from("user_roles").insert({
    user_id: created.user.id,
    role: "admin",
  });
  if (rErr) throw new Error(rErr.message);
  return { ok: true, email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD } as const;
});

// Admin-only: create a teacher or student account with role + profile.
export const createSchoolUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    email: z.string().email(),
    password: z.string().min(8),
    full_name: z.string().min(1).max(120),
    role: z.enum(["teacher", "student"]),
    grade_id: z.string().uuid().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (cErr || !created.user) throw new Error(cErr?.message ?? "Failed");

    await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      full_name: data.full_name,
      email: data.email,
      grade_id: data.role === "student" ? (data.grade_id ?? null) : null,
    });
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: created.user.id,
      role: data.role,
    });
    if (rErr) throw new Error(rErr.message);
    return { ok: true, user_id: created.user.id };
  });

// Admin-only: delete a user entirely.
export const deleteSchoolUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin-only: list all users with roles + profiles.
export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data: profiles, error: pErr } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, grade_id, created_at")
      .order("created_at", { ascending: false });
    if (pErr) throw new Error(pErr.message);
    const { data: roles, error: rErr } = await context.supabase
      .from("user_roles")
      .select("user_id, role");
    if (rErr) throw new Error(rErr.message);
    const rolesByUser = new Map<string, string[]>();
    roles?.forEach((r) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    return (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
  });
