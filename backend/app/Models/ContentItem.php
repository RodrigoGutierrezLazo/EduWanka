<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentItem extends Model
{
    protected $table = 'content_items';

    protected $fillable = [
        'module_section_id',
        'type',
        'title',
        'path',
        'url',
        'body_html',
        'referenced_id',
        'meta',
        'order',
        'published',
    ];

    protected function casts(): array
    {
        return [
            'meta'      => 'array',
            'published' => 'boolean',
            'order'     => 'integer',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(ModuleSection::class, 'module_section_id');
    }

    /**
     * Resolve the referenced entity (exam, questionnaire, substitute_exam, assignment)
     * dynamically based on content_type.
     */
    public function resolved(): mixed
    {
        return match ($this->type) {
            'questionnaire'  => Questionnaire::find($this->referenced_id),
            'substitute_exam'=> SubstituteExam::find($this->referenced_id),
            'assignment'     => Assignment::find($this->referenced_id),
            default          => null,
        };
    }

    /** Appends the resolved entity when serialized. */
    public function toArray(): array
    {
        $array = parent::toArray();
        if (in_array($this->type, ['questionnaire', 'substitute_exam', 'assignment'])) {
            $array['resolved'] = $this->resolved();
        }
        return $array;
    }
}
