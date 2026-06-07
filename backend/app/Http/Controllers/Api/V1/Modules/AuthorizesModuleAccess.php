<?php

namespace App\Http\Controllers\Api\V1\Modules;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\ModuleSection;
use Illuminate\Http\Request;

trait AuthorizesModuleAccess
{
    /**
     * Verifies that the current user can manage content for the given course.
     * Admin/Superadmin → always allowed.
     * Prof → only courses where assigned_prof_id = user.id.
     *
     * Returns the authorized course or aborts with 403.
     */
    protected function authorizedCourse(Request $request, Course $course): Course
    {
        $user = $request->user();

        if (in_array($user->role, ['admin', 'superadmin'])) {
            return $course;
        }

        if ($user->role === 'prof' && $course->assigned_prof_id === $user->id) {
            return $course;
        }

        if ($user->role === 'student' && $request->isMethod('GET')) {
            $hasAccess = $user->purchases()
                ->where('course_code', $course->code)
                ->whereIn('status', ['validated', 'paid'])
                ->exists();

            if ($hasAccess) {
                return $course;
            }
        }

        abort(403, 'No tienes permiso para acceder al contenido de este curso.');
    }

    /**
     * Verifies that the user can manage the given module (through its course).
     */
    protected function authorizedModule(Request $request, CourseModule $module): CourseModule
    {
        $this->authorizedCourse($request, $module->course);
        return $module;
    }

    /**
     * Verifies that the user can manage the given section (through its module's course).
     */
    protected function authorizedSection(Request $request, ModuleSection $section): ModuleSection
    {
        $this->authorizedModule($request, $section->module);
        return $section;
    }
}
