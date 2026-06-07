/**
 * ProfessorMateriales — Sprint 11
 *
 * Reutiliza exactamente el mismo componente AdminMateriales.
 * La diferencia de autorización ocurre en el backend mediante
 * el trait AuthorizesModuleAccess (solo cursos donde assigned_prof_id = user.id).
 *
 * En el frontend, la única diferencia es que este componente vive
 * bajo la ruta /aula/profesor/materiales/:courseId.
 */
export { default } from '@/pages/aula/admin/AdminMateriales';
