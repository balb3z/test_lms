import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

type Dict = Record<string, { en: string; ar: string }>;

export const DICT: Dict = {
  app_name: { en: "Madrasa LMS", ar: "نظام مدرستي" },
  tagline: { en: "School Learning Management", ar: "نظام إدارة التعلم المدرسي" },
  sign_in: { en: "Sign in", ar: "تسجيل الدخول" },
  sign_out: { en: "Sign out", ar: "تسجيل الخروج" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  password: { en: "Password", ar: "كلمة المرور" },
  full_name: { en: "Full name", ar: "الاسم الكامل" },
  google: { en: "Continue with Google", ar: "المتابعة باستخدام جوجل" },
  or: { en: "or", ar: "أو" },
  dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  admin: { en: "Admin", ar: "المدير" },
  teacher: { en: "Teacher", ar: "المعلم" },
  student: { en: "Student", ar: "الطالب" },
  teachers: { en: "Teachers", ar: "المعلمون" },
  students: { en: "Students", ar: "الطلاب" },
  grades: { en: "Grades", ar: "الصفوف" },
  subjects: { en: "Subjects", ar: "المواد" },
  sessions: { en: "Sessions", ar: "الحصص" },
  materials: { en: "Materials", ar: "المواد التعليمية" },
  assignments: { en: "Assignments", ar: "الواجبات" },
  attendance: { en: "Attendance", ar: "الحضور" },
  users: { en: "Users", ar: "المستخدمون" },
  assignments_mgmt: { en: "Assignments", ar: "إدارة المهام" },
  add: { en: "Add", ar: "إضافة" },
  edit: { en: "Edit", ar: "تعديل" },
  delete: { en: "Delete", ar: "حذف" },
  save: { en: "Save", ar: "حفظ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  create: { en: "Create", ar: "إنشاء" },
  back: { en: "Back", ar: "رجوع" },
  loading: { en: "Loading…", ar: "جاري التحميل…" },
  no_data: { en: "No data yet", ar: "لا توجد بيانات بعد" },
  title: { en: "Title", ar: "العنوان" },
  description: { en: "Description", ar: "الوصف" },
  date_time: { en: "Date & time", ar: "التاريخ والوقت" },
  duration_min: { en: "Duration (min)", ar: "المدة (دقيقة)" },
  zoom_url: { en: "Zoom URL", ar: "رابط زووم" },
  enter_meeting: { en: "Enter meeting", ar: "دخول الحصة" },
  upcoming_sessions: { en: "Upcoming sessions", ar: "الحصص القادمة" },
  past_sessions: { en: "Past sessions", ar: "الحصص السابقة" },
  my_subjects: { en: "My subjects", ar: "موادي" },
  my_teachers: { en: "My teachers", ar: "معلموني" },
  my_grade: { en: "My grade", ar: "صفي" },
  role: { en: "Role", ar: "الدور" },
  grade: { en: "Grade", ar: "الصف" },
  subject: { en: "Subject", ar: "المادة" },
  primary: { en: "Primary", ar: "ابتدائي" },
  preparatory: { en: "Preparatory", ar: "إعدادي" },
  create_user: { en: "Create user", ar: "إنشاء مستخدم" },
  create_teacher: { en: "Create teacher", ar: "إنشاء معلم" },
  create_student: { en: "Create student", ar: "إنشاء طالب" },
  create_session: { en: "Schedule session", ar: "جدولة حصة" },
  create_material: { en: "Add material", ar: "إضافة مادة تعليمية" },
  create_assignment: { en: "Create assignment", ar: "إنشاء واجب" },
  assign_teacher: { en: "Assign teacher", ar: "تعيين معلم" },
  type: { en: "Type", ar: "النوع" },
  pdf: { en: "PDF", ar: "ملف PDF" },
  video: { en: "Video link", ar: "رابط فيديو" },
  note: { en: "Note", ar: "ملاحظة" },
  link: { en: "Link", ar: "رابط" },
  url: { en: "URL", ar: "الرابط" },
  content: { en: "Content", ar: "المحتوى" },
  due_at: { en: "Due date", ar: "تاريخ التسليم" },
  max_score: { en: "Max score", ar: "الدرجة العظمى" },
  submit: { en: "Submit", ar: "إرسال" },
  submission: { en: "Submission", ar: "التسليم" },
  submitted: { en: "Submitted", ar: "تم التسليم" },
  not_submitted: { en: "Not submitted", ar: "لم يتم التسليم" },
  grade_btn: { en: "Grade", ar: "تقدير" },
  feedback: { en: "Feedback", ar: "ملاحظات" },
  score: { en: "Score", ar: "الدرجة" },
  present: { en: "Present", ar: "حاضر" },
  absent: { en: "Absent", ar: "غائب" },
  late: { en: "Late", ar: "متأخر" },
  mark_attendance: { en: "Mark attendance", ar: "تسجيل الحضور" },
  overview: { en: "Overview", ar: "نظرة عامة" },
  total_students: { en: "Total students", ar: "إجمالي الطلاب" },
  total_teachers: { en: "Total teachers", ar: "إجمالي المعلمين" },
  total_sessions: { en: "Total sessions", ar: "إجمالي الحصص" },
  total_subjects: { en: "Subjects", ar: "المواد" },
  init_admin: { en: "Seed default admin", ar: "إنشاء حساب المدير الافتراضي" },
  default_admin_hint: {
    en: "First-time setup creates admin@school.local / Admin@12345",
    ar: "سيُنشئ هذا حساب admin@school.local بكلمة المرور Admin@12345",
  },
  done: { en: "Done", ar: "تم" },
  assign_subject: { en: "Assign to subject", ar: "تعيين على مادة" },
  pick_student: { en: "Pick student", ar: "اختر الطالب" },
  pick_subject: { en: "Pick subject", ar: "اختر المادة" },
  pick_teacher: { en: "Pick teacher", ar: "اختر المعلم" },
  pick_grade: { en: "Pick grade", ar: "اختر الصف" },
  notes: { en: "Notes", ar: "ملاحظات" },
  language: { en: "Language", ar: "اللغة" },
};

interface I18nCtx { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof DICT) => string; dir: "ltr" | "rtl"; }
const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("lms.lang") as Lang) || "en";
  });
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lms.lang", lang);
  }, [lang]);
  const value: I18nCtx = {
    lang,
    setLang: (l) => setLangState(l),
    t: (k) => DICT[k]?.[lang] ?? String(k),
    dir: lang === "ar" ? "rtl" : "ltr",
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be inside I18nProvider");
  return c;
}
