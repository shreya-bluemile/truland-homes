<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $types = QuotationRequest::DOCUMENT_TYPES;

        return [
            'body' => ['required', 'string', 'max:5000'],
            'files' => ['nullable', 'array', 'max:10'],
            'files.*' => ['file', 'max:'.QuotationRequest::MAX_FILE_KB, 'extensions:'.$types, 'mimes:'.$types],
            'remove_attachment_ids' => ['nullable', 'array'],
            'remove_attachment_ids.*' => ['integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'Write a note before saving.',
            'files.*.max' => 'Each file must be 10 MB or smaller.',
            'files.*.extensions' => 'Files must be PDF, Word, Excel, CSV, JPG or PNG.',
            'files.*.mimes' => 'Files must be PDF, Word, Excel, CSV, JPG or PNG.',
        ];
    }
}
