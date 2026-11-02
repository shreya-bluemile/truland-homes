<?php

namespace App\Http\Requests;

use App\Models\Quotation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Used for creating and updating quotations.
 * action=draft only needs a lot; action=send needs every field marked * in the form.
 */
class QuotationRequest extends FormRequest
{
    public const DOCUMENT_TYPES = 'pdf,doc,docx,xls,xlsx,csv,jpg,jpeg,png';

    public const MAX_FILE_KB = 10240;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $send = $this->input('action') === 'send';
        $categoryId = $this->integer('contractor_category_id');
        $quotation = $this->route('quotation');

        return [
            'action' => ['required', Rule::in(['draft', 'send'])],
            'lot_id' => ['required', 'integer', Rule::exists('lots', 'id')],
            'contractor_category_id' => [$send ? 'required' : 'nullable', 'integer', Rule::exists('contractor_categories', 'id')],
            'contractor_ids' => array_filter([$send ? 'required' : 'nullable', 'array', $send ? 'min:1' : null]),
            'contractor_ids.*' => [
                'integer', 'distinct',
                Rule::exists('contractors', 'id')
                    ->where('contractor_category_id', $categoryId)
                    ->where('is_active', true)
                    ->whereNull('deleted_at'),
            ],
            'due_date' => array_filter([$send ? 'required' : 'nullable', 'date_format:Y-m-d', $send ? 'after_or_equal:today' : null]),
            'reminder_days' => ['nullable', 'integer', Rule::in(Quotation::REMINDER_OPTIONS)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'template_ids' => ['nullable', 'array'],
            'template_ids.*' => ['integer', Rule::exists('scope_templates', 'id')->where('contractor_category_id', $categoryId)],
            'keep_document_ids' => ['nullable', 'array'],
            'keep_document_ids.*' => ['integer', Rule::exists('quotation_documents', 'id')->where('quotation_id', $quotation?->id ?? 0)],
            'files' => ['nullable', 'array', 'max:20'],
            'files.*' => ['file', 'max:'.self::MAX_FILE_KB, 'extensions:'.self::DOCUMENT_TYPES, 'mimes:'.self::DOCUMENT_TYPES],
        ];
    }

    public function messages(): array
    {
        return [
            'contractor_ids.required' => 'Select at least one contractor.',
            'contractor_ids.min' => 'Select at least one contractor.',
            'contractor_ids.*.exists' => 'One of the selected contractors is not active in this category.',
            'due_date.after_or_equal' => 'The due date can’t be in the past.',
            'files.*.max' => 'Each document must be 10 MB or smaller.',
            'files.*.extensions' => 'Documents must be PDF, Word, Excel, CSV, JPG or PNG files.',
            'files.*.mimes' => 'Documents must be PDF, Word, Excel, CSV, JPG or PNG files.',
        ];
    }

    public function attributes(): array
    {
        return [
            'lot_id' => 'lot address',
            'contractor_category_id' => 'contractor category',
            'contractor_ids' => 'contractors',
            'due_date' => 'due date',
            'reminder_days' => 'reminder',
        ];
    }
}
