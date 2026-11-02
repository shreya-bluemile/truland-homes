<?php

namespace App\Services;

/**
 * Fills email templates.
 *
 *   {{name}}                 replaced with the value, HTML-escaped (line breaks kept)
 *   {{#name}} … {{/name}}    section kept only when "name" has a value
 *
 * Values listed in $rawKeys are trusted HTML built by the system (e.g. the upload button).
 */
class EmailTemplateRenderer
{
    /** @return array{subject: string, html: string} */
    public function render(string $subject, string $body, array $values, array $rawKeys = []): array
    {
        return [
            'subject' => $this->fill($subject, $values, [], false),
            'html' => $this->fill($body, $values, $rawKeys, true),
        ];
    }

    private function fill(string $text, array $values, array $rawKeys, bool $html): string
    {
        $text = preg_replace_callback(
            '/\{\{#\s*(\w+)\s*\}\}(.*?)\{\{\/\s*\1\s*\}\}/s',
            fn ($m) => filled($values[$m[1]] ?? null) ? $m[2] : '',
            $text
        );

        return preg_replace_callback('/\{\{\s*(\w+)\s*\}\}/', function ($m) use ($values, $rawKeys, $html) {
            if (! array_key_exists($m[1], $values)) {
                return $m[0]; // unknown placeholder: leave it visible so it can be spotted and fixed
            }
            $value = (string) $values[$m[1]];
            if (! $html) {
                return $value;
            }

            return in_array($m[1], $rawKeys, true) ? $value : nl2br(e($value), false);
        }, $text);
    }

    /** Placeholders available in quotation emails, with what they contain (shown in Settings). */
    public static function quotationPlaceholders(): array
    {
        return [
            'contractor_name' => 'Contractor’s name',
            'quote_no' => 'Quotation number, e.g. Q-0148',
            'category' => 'Contractor category, e.g. Concrete',
            'category_lower' => 'Category in lower case, e.g. concrete',
            'lot_address' => 'Full lot address',
            'lot_short' => 'Lot number, e.g. Lot 14',
            'floor_plan' => 'Selected floor plan',
            'due_date' => 'Due date, e.g. 06-11-2026',
            'due_date_long' => 'Due date in words, e.g. Friday 6 November 2026',
            'notes' => 'Notes for contractors entered on the quotation',
            'upload_link' => 'Contractor’s private upload link',
            'upload_button' => 'Red “Upload your quotation” button with a fallback link',
        ];
    }
}
