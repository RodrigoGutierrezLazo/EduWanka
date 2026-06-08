<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validación del formulario público del Libro de Reclamaciones. Recoge los
 * datos mínimos exigidos por Indecopi para una hoja de reclamación válida.
 */
class StoreComplaintRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Endpoint público: el Libro de Reclamaciones es de acceso libre por ley.
        return true;
    }

    public function rules(): array
    {
        return [
            'type'              => ['required', Rule::in(['reclamo', 'queja'])],

            // Datos del consumidor
            'full_name'         => ['required', 'string', 'max:255'],
            'document_type'     => ['nullable', Rule::in(['DNI', 'CE', 'Pasaporte'])],
            'document_number'   => ['required', 'string', 'min:6', 'max:20'],
            'email'             => ['required', 'email', 'max:255'],
            'phone'             => ['required', 'string', 'max:30'],
            'address'           => ['required', 'string', 'max:1000'],

            // Menor de edad
            'is_minor'                  => ['boolean'],
            'guardian_name'             => ['nullable', 'required_if:is_minor,true', 'string', 'max:255'],
            'guardian_document_number'  => ['nullable', 'required_if:is_minor,true', 'string', 'min:6', 'max:20'],

            // Bien contratado
            'claimed_item'      => ['required', 'string', 'max:255'],
            'claimed_item_type' => ['nullable', Rule::in(['producto', 'servicio'])],
            'claimed_amount'    => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'course_id'         => ['nullable', 'integer', 'exists:courses,id'],

            // Detalle
            'detail'            => ['required', 'string', 'max:5000'],
            'consumer_request'  => ['required', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'guardian_name.required_if'            => 'Al ser menor de edad, el nombre del padre/tutor es obligatorio.',
            'guardian_document_number.required_if' => 'Al ser menor de edad, el documento del padre/tutor es obligatorio.',
            'type.in'                              => 'El tipo debe ser un reclamo o una queja.',
        ];
    }
}
