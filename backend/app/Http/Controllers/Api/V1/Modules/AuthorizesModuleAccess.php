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

    /**
     * Returns the IDs of the courses the current user is allowed to see content for.
     * Admin/superadmin → every course visible to them (Course is BelongsToTenant, so
     * this is already scoped to their tenant). Prof → only courses assigned to them.
     * Student → only courses with a validated/paid purchase.
     *
     * Used to scope index() listings of Assignment/Questionnaire/SubstituteExam, which
     * have no tenant_id of their own and would otherwise leak cross-course and
     * cross-tenant data through an unfiltered ::all()/::with(...)->get().
     */
    protected function authorizedCourseIds(Request $request): array
    {
        $user = $request->user();

        if (in_array($user->role, ['admin', 'superadmin'], true)) {
            return Course::query()->pluck('id')->all();
        }

        if ($user->role === 'prof') {
            return Course::query()->where('assigned_prof_id', $user->id)->pluck('id')->all();
        }

        $courseCodes = $user->purchases()
            ->whereIn('status', ['validated', 'paid'])
            ->pluck('course_code');

        return Course::query()->whereIn('code', $courseCodes)->pluck('id')->all();
    }

    /**
     * Hides the answer key (`is_correct`) of quiz options from roles that manage
     * no courses (i.e. students), so the correct answers never travel in listings
     * or detail payloads before/while the student attempts the evaluation.
     * Admin/superadmin/prof keep seeing it since they author the content.
     *
     * @param  \Illuminate\Database\Eloquent\Model|iterable<\Illuminate\Database\Eloquent\Model>  $items  Questionnaire/SubstituteExam model(s) with `questions.options` loaded
     */
    protected function hideAnswerKeyFromStudents(Request $request, $items): void
    {
        $user = $request->user();

        if (in_array($user->role, ['admin', 'superadmin', 'prof'], true)) {
            return;
        }

        $entities = $items instanceof \Illuminate\Support\Collection || is_iterable($items) && ! ($items instanceof \Illuminate\Database\Eloquent\Model)
            ? $items
            : [$items];

        foreach ($entities as $entity) {
            foreach ($entity->questions as $question) {
                foreach ($question->options as $option) {
                    $option->makeHidden('is_correct');
                }
            }
        }
    }
}
