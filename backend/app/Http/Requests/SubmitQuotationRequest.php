<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** A contractor uploading their quotation through the public link. */
class SubmitQuotationRequest extends FormRequest
{
    public const TYPES = 'pdf,xls,xlsx,csv,doc,docx';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:'.QuotationRequest::MAX_FILE_KB, 'extensions:'.self::TYPES, 'mimes:'.self::TYPES],
            'message' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Choose your quotation file to upload.',
            'file.max' => 'The file must be 10 MB or smaller.',
            'file.extensions' => 'Upload a PDF, Excel or Word file.',
            'file.mimes' => 'Upload a PDF, Excel or Word file.',
        ];
    }
}
