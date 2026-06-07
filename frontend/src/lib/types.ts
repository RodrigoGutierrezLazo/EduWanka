export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'prof' | 'admin' | 'superadmin';
  dni?: string;
  phone?: string;
  avatar_url?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  duration_weeks: number;
  code?: string;
  level?: string;
  image_url?: string;
  teacher_name?: string;
  is_published?: boolean;
  slug?: string;
}

export interface Purchase {
  id: number;
  user_id: number;
  course_id: number;
  status: 'pending_validation' | 'validated' | 'pending_payment' | 'paid' | 'rejected';
  amount: number;
  course?: Course;
  user?: User;
  created_at: string;
}

export interface ExamAttempt {
  id: number;
  score: number;
  passed: boolean;
  course?: Course;
}

export interface Certificate {
  id: number;
  certificate_code: string;
  issued_at: string;
  user?: User;
  course?: Course;
}

export interface AdminData {
  pending_payments: Purchase[];
  pending_payments_count: number;
  total_users: number;
  total_admins?: number;
  total_teachers?: number;
  total_students?: number;
  total_courses: number;
  published_courses?: number;
  enrollments_today?: number;
  validated_purchases: number;
  paid_purchases: number;
  pending_certificates: number;
  latest_users?: User[];
  revenue: number;
}

// ─── Sprint 11: Sistema de Módulos tipo Moodle ──────────────────────────────

export type ContentType =
  | 'video'
  | 'file'
  | 'meet'
  | 'questionnaire'
  | 'substitute_exam'
  | 'text'
  | 'url'
  | 'assignment';

export interface ContentItem {
  id: number;
  module_section_id: number;
  type: ContentType;
  title: string;
  url?: string | null;
  path?: string | null;
  file_url?: string | null;
  body_html?: string | null;
  referenced_id?: number | null;
  meta?: Record<string, unknown> | null;
  order: number;
  published: boolean;
  resolved?: Record<string, unknown> | null;
}

export interface ModuleSection {
  id: number;
  course_module_id: number;
  title: string;
  order: number;
  items: ContentItem[];
}

export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  order: number;
  sections: ModuleSection[];
}

