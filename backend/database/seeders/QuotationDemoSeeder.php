<?php

namespace Database\Seeders;

use App\Models\ContractorCategory;
use App\Models\Lot;
use App\Models\Quotation;
use App\Models\QuotationRecipient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

/**
 * Lots, trades, contractors and a few quotations matching the Figma screens, so the
 * module has something to show on a fresh install. Safe to run more than once.
 */
class QuotationDemoSeeder extends Seeder
{
    public function run(): void
    {
        $lots = [
            'Lot 14' => ['street' => '22 Harbour View Road', 'suburb' => 'Melbourne', 'floor_plan' => 'Ground Floor Plan',
                'documents' => ['A01 – Site Plan.pdf', 'A02 – Floor Plan.pdf', 'S01 – Engineering & Slab Design.pdf', 'Soil Report – Lot 14.pdf']],
            'Lot 7' => ['street' => '9 Banksia Court', 'suburb' => 'Geelong', 'floor_plan' => 'Double Storey Plan',
                'documents' => ['A01 – Site Plan.pdf', 'A02 – Floor Plan.pdf']],
            'Lot 31' => ['street' => '120 Ridge Street', 'suburb' => 'Ballarat', 'floor_plan' => 'Ground Floor Plan',
                'documents' => ['A01 – Site Plan.pdf', 'Roof Plan – Lot 31.pdf']],
            'Lot 27' => ['street' => '12 Valda Crescent', 'suburb' => 'Darley VIC 3340', 'floor_plan' => 'Co-living',
                'documents' => ['A01 – Site Plan.pdf']],
        ];
        foreach ($lots as $number => $data) {
            $lot = Lot::firstOrCreate(['lot_number' => $number, 'street' => $data['street']],
                ['suburb' => $data['suburb'], 'floor_plan' => $data['floor_plan']]);
            foreach ($data['documents'] as $name) {
                if (! $lot->documents()->where('name', $name)->exists()) {
                    $lot->documents()->create($this->file("lots/{$lot->id}", $name));
                }
            }
        }

        $trades = [
            'Concrete' => [
                'templates' => ['Slab Specification – DS Homes.pdf', 'Slab Pricing Schedule.xlsx'],
                'contractors' => ['Northline Concrete' => 'quotes@northline.com', 'Apex Slabs & Footings' => 'office@apexslabs.com',
                    'Granite Bay Concreting' => 'jobs@granitebay.com', 'Delta Pour Co.' => 'hello@deltapour.com'],
            ],
            'Framing' => [
                'templates' => ['Framing Specification.pdf'],
                'contractors' => ['Timberline Frames' => 'quotes@timberline.com', 'Southern Truss & Frame' => 'info@southerntruss.com',
                    'Precision Carpentry' => 'jobs@precisioncarpentry.com'],
            ],
            'Roofing' => [
                'templates' => ['Roofing Specification.pdf'],
                'contractors' => ['Summit Roofing' => 'quotes@summitroofing.com', 'Coastal Roof Co.' => 'hello@coastalroof.com'],
            ],
            'Plumbing' => [
                'templates' => ['Plumbing Scope.pdf'],
                'contractors' => ['FlowRight Plumbing' => 'office@flowright.com', 'Bayside Plumbers' => 'jobs@baysideplumbers.com',
                    'Clearwater Plumbing' => 'quotes@clearwater.com'],
            ],
            'Electrical' => [
                'templates' => [],
                'contractors' => ['Brightspark Electrical' => 'quotes@brightspark.com', 'Volt Electrical' => 'info@voltelectrical.com'],
            ],
        ];
        foreach ($trades as $name => $data) {
            $category = ContractorCategory::firstOrCreate(['name' => $name]);
            foreach ($data['templates'] as $template) {
                if (! $category->documents()->where('name', $template)->exists()) {
                    $category->documents()->create($this->file("templates/{$category->id}", $template));
                }
            }
            foreach ($data['contractors'] as $contractor => $email) {
                $category->contractors()->firstOrCreate(['name' => $contractor], ['email' => $email]);
            }
        }

        $this->quotations();
    }

    private function quotations(): void
    {
        $admin = User::query()->orderBy('id')->first();
        $today = Carbon::today();
        $examples = [
            // number, lot, trade, created days ago, due in days, recipient statuses
            ['Q-0145', 'Lot 14', 'Plumbing', 11, -4, [QuotationRecipient::QUOTED, QuotationRecipient::QUOTED, QuotationRecipient::NOT_QUOTING]],
            ['Q-0146', 'Lot 31', 'Roofing', 8, -2, [QuotationRecipient::AWAITING, QuotationRecipient::AWAITING]],
            ['Q-0147', 'Lot 7', 'Framing', 6, 3, [QuotationRecipient::RECEIVED, QuotationRecipient::NOT_QUOTING, QuotationRecipient::QUOTED]],
            ['Q-0148', 'Lot 14', 'Concrete', 5, 4, [QuotationRecipient::QUOTED, QuotationRecipient::AWAITING, QuotationRecipient::AWAITING, QuotationRecipient::AWAITING]],
        ];

        foreach ($examples as [$number, $lotNumber, $trade, $createdAgo, $dueIn, $statuses]) {
            if (Quotation::where('number', $number)->exists()) {
                continue;
            }
            $lot = Lot::where('lot_number', $lotNumber)->first();
            $category = ContractorCategory::where('name', $trade)->first();
            $created = $today->copy()->subDays($createdAgo)->setTime(14, 10);

            $quotation = Quotation::create([
                'number' => $number, 'lot_id' => $lot->id, 'contractor_category_id' => $category->id,
                'created_by' => $admin->id, 'due_date' => $today->copy()->addDays($dueIn),
                'reminder_days' => $trade === 'Concrete' ? null : 3, 'status' => Quotation::SENT, 'sent_at' => $created,
            ]);
            $quotation->forceFill(['created_at' => $created, 'updated_at' => $created])->save();

            foreach ($lot->documents as $doc) {
                $quotation->documents()->create(['name' => $doc->name, 'path' => $doc->path, 'size' => $doc->size, 'source' => 'lot']);
            }
            foreach ($category->documents as $doc) {
                $quotation->documents()->create(['name' => $doc->name, 'path' => $doc->path, 'size' => $doc->size, 'source' => 'template']);
            }

            foreach ($category->contractors->take(count($statuses))->values() as $i => $contractor) {
                $status = $statuses[$i];
                $responded = $status === QuotationRecipient::AWAITING ? null : $created->copy()->addDay()->addMinutes(5 * $i);
                $recipient = $quotation->recipients()->create([
                    'contractor_id' => $contractor->id, 'token' => Str::random(40), 'status' => $status,
                    'sent_at' => $created, 'responded_at' => $responded,
                    'opened_at' => $status === QuotationRecipient::AWAITING && $i % 2 ? null : $created->copy()->addHours(3),
                ]);
                if ($status === QuotationRecipient::QUOTED) {
                    $recipient->update($this->file("quotes/{$quotation->id}", "Quote – {$contractor->name}.pdf", 'quote_'));
                }
            }

            $quotation->activities()->create(['actor_name' => $admin->name, 'description' => "{$admin->name} sent the quotation to ".count($statuses).' contractors.', 'created_at' => $created]);
            $note = $quotation->notes()->create(['user_id' => $admin->id, 'body' => 'Confirmed site access with the council. Contractor briefed on start conditions and safety procedures.']);
            $note->attachments()->create($this->file("notes/{$note->id}", 'Site_Brief.pdf'));
            $quotation->activities()->create(['actor_name' => $admin->name, 'description' => "{$admin->name} added a note.", 'created_at' => $created->copy()->addHour()]);
        }
    }

    /** Writes a small, valid sample file and returns its name, path and size (prefixed for recipient quote columns). */
    private function file(string $folder, string $name, string $prefix = ''): array
    {
        $path = $folder.'/'.Str::uuid().'.'.pathinfo($name, PATHINFO_EXTENSION);
        Storage::disk('local')->put($path, str_ends_with($name, '.xlsx') ? $this->xlsx($name) : $this->pdf($name));

        return [$prefix.'name' => $name, $prefix.'path' => $path, $prefix.'size' => Storage::disk('local')->size($path)];
    }

    private function pdf(string $title): string
    {
        $text = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], Str::ascii($title).' - sample document');
        $stream = "BT /F1 18 Tf 72 720 Td ({$text}) Tj ET";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$object}\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf.'trailer << /Size '.(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }

    private function xlsx(string $title): string
    {
        $tmp = tempnam(sys_get_temp_dir(), 'xlsx');
        $zip = new ZipArchive;
        $zip->open($tmp, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Pricing" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
        $zip->addFromString('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>'.htmlspecialchars($title).'</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Item</t></is></c><c r="B2" t="inlineStr"><is><t>Price (ex GST)</t></is></c></row></sheetData></worksheet>');
        $zip->close();
        $contents = file_get_contents($tmp);
        @unlink($tmp);

        return $contents;
    }
}
