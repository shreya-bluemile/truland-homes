<?php

namespace Database\Seeders;

use App\Models\Contractor;
use App\Models\ContractorCategory;
use App\Models\Lot;
use App\Services\FileStorage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

/**
 * Categories, contractors, lots and scope documents to start with (names taken from the Figma design).
 * Edit or remove them from the Contractors and Settings pages. Safe to re-run.
 */
class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $contractors = [
            'Concrete' => [
                ['Northline Concrete', 'quotes@northline.com'],
                ['Apex Slabs & Footings', 'office@apexslabs.com'],
                ['Granite Bay Concreting', 'jobs@granitebay.com'],
                ['Delta Pour Co.', 'hello@deltapour.com'],
            ],
            'Framing' => [['Southern Frame Co.', 'quotes@southernframe.com.au'], ['TrueLine Carpentry', 'office@truelinecarpentry.com.au']],
            'Roofing' => [['Summit Roofing', 'estimating@summitroofing.com.au'], ['Coastal Roof & Gutter', 'hello@coastalroof.com.au']],
            'Plumbing' => [['Bayside Plumbing', 'quotes@baysideplumbing.com.au'], ['Flowright Plumbers', 'jobs@flowright.com.au']],
            'Electrical' => [['Brightwire Electrical', 'quotes@brightwire.com.au']],
        ];

        foreach ($contractors as $categoryName => $people) {
            $category = ContractorCategory::firstOrCreate(['name' => $categoryName]);
            foreach ($people as [$name, $email]) {
                Contractor::firstOrCreate(['email' => $email], ['name' => $name, 'contractor_category_id' => $category->id]);
            }
        }

        foreach ([
            ['Lot 14, 22 Harbour View Road, Melbourne', 'Ground Floor Plan'],
            ['Lot 7, 9 Banksia Court', 'Co-living'],
            ['Lot 31, 120 Ridge Street', 'Double Storey'],
            ['Lot 27, 12 Valda Crescent, Darley VIC 3340', 'Ground Floor Plan'],
        ] as [$address, $floorPlan]) {
            Lot::firstOrCreate(['address' => $address], ['floor_plan' => $floorPlan]);
        }

        $concrete = ContractorCategory::where('name', 'Concrete')->first();
        if ($concrete->scopeTemplates()->doesntExist()) {
            $this->addTemplate($concrete, 'Slab Specification – DS Homes.pdf', 'application/pdf',
                $this->pdf('Slab Specification – DS Homes', 'Sample scope document. Replace it under Settings → Contractor Categories.'));
            $this->addTemplate($concrete, 'Slab Pricing Schedule.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                $this->xlsx([['Item', 'Unit', 'Quantity', 'Rate', 'Total'], ['Slab', 'm2', '', '', ''], ['Footings', 'lm', '', '', ''], ['Pump hire', 'day', '', '', '']]));
        }
    }

    private function addTemplate(ContractorCategory $category, string $name, string $mime, string $contents): void
    {
        $path = "scope-templates/{$category->id}/".Str::uuid().'-'.$name;
        Storage::disk(FileStorage::DISK)->put($path, $contents);
        $category->scopeTemplates()->create(['name' => $name, 'path' => $path, 'size' => strlen($contents), 'mime_type' => $mime]);
    }

    /** A small but valid one-page PDF. */
    private function pdf(string $title, string $text): string
    {
        $esc = fn ($s) => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], iconv('UTF-8', 'windows-1252//TRANSLIT', $s));
        $stream = "BT /F1 18 Tf 72 760 Td ({$esc($title)}) Tj ET\nBT /F1 11 Tf 72 730 Td ({$esc($text)}) Tj ET";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
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

        return $pdf.'trailer << /Size '.(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF\n";
    }

    /** A small but valid single-sheet Excel workbook. */
    private function xlsx(array $rows): string
    {
        $sheetRows = '';
        foreach ($rows as $r => $cells) {
            $sheetRows .= '<row r="'.($r + 1).'">';
            foreach ($cells as $c => $value) {
                $ref = chr(65 + $c).($r + 1);
                $sheetRows .= '<c r="'.$ref.'" t="inlineStr"><is><t>'.htmlspecialchars($value, ENT_XML1).'</t></is></c>';
            }
            $sheetRows .= '</row>';
        }

        $file = tempnam(sys_get_temp_dir(), 'xlsx');
        $zip = new ZipArchive;
        $zip->open($file, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Pricing" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
        $zip->addFromString('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'.$sheetRows.'</sheetData></worksheet>');
        $zip->close();
        $contents = file_get_contents($file);
        unlink($file);

        return $contents;
    }
}
