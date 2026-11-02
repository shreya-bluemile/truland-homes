<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Models\QuotationDocument;
use App\Services\FileStorage;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class QuotationDocumentController extends Controller
{
    public function download(Quotation $quotation, QuotationDocument $document): StreamedResponse
    {
        return Storage::disk(FileStorage::DISK)->download($document->path, $document->name);
    }

    /** "Download all": every document of the quotation in one zip. */
    public function downloadAll(Quotation $quotation, FileStorage $files): BinaryFileResponse
    {
        $documents = $quotation->documents;
        abort_if($documents->isEmpty(), 404, 'This quotation has no documents.');

        $zipPath = tempnam(sys_get_temp_dir(), 'quote-docs-');
        $zip = new ZipArchive;
        abort_unless($zip->open($zipPath, ZipArchive::OVERWRITE) === true, 500, 'Could not create the zip file.');

        $used = [];
        foreach ($documents as $document) {
            if (! $files->exists($document->path)) {
                continue;
            }
            $zip->addFile($files->absolutePath($document->path), $this->uniqueName($document->name, $used));
        }
        $zip->close();

        return response()->download($zipPath, "{$quotation->quote_no}-documents.zip", ['Content-Type' => 'application/zip'])
            ->deleteFileAfterSend();
    }

    /** "Plan.pdf", "Plan.pdf" → "Plan.pdf", "Plan (2).pdf" so zip entries never overwrite each other. */
    private function uniqueName(string $name, array &$used): string
    {
        $candidate = $name;
        $info = pathinfo($name);
        for ($i = 2; isset($used[mb_strtolower($candidate)]); $i++) {
            $candidate = $info['filename']." ({$i})".(isset($info['extension']) ? '.'.$info['extension'] : '');
        }
        $used[mb_strtolower($candidate)] = true;

        return $candidate;
    }
}
