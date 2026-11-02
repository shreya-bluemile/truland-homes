<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Stores files on the private "local" disk (storage/app/private), never in public/.
 * Files are only served through authorised download endpoints.
 */
class FileStorage
{
    public const DISK = 'local';

    /** @return array{name: string, path: string, size: int, mime_type: string|null} */
    public function store(UploadedFile $file, string $directory): array
    {
        $name = $this->cleanName($file->getClientOriginalName());
        $path = $file->storeAs($directory, Str::uuid().'-'.$name, self::DISK);

        return [
            'name' => $name,
            'path' => $path,
            'size' => $file->getSize(),
            'mime_type' => $file->getClientMimeType(),
        ];
    }

    public function copy(string $from, string $directory, string $name): string
    {
        $to = $directory.'/'.Str::uuid().'-'.$this->cleanName($name);
        Storage::disk(self::DISK)->copy($from, $to);

        return $to;
    }

    public function delete(array|string $paths): void
    {
        Storage::disk(self::DISK)->delete($paths);
    }

    public function absolutePath(string $path): string
    {
        return Storage::disk(self::DISK)->path($path);
    }

    public function exists(string $path): bool
    {
        return Storage::disk(self::DISK)->exists($path);
    }

    /** Keeps the readable file name but strips characters that are unsafe in paths. */
    private function cleanName(string $name): string
    {
        $name = str_replace(['/', '\\', "\0"], '-', $name);

        return Str::limit(trim($name) ?: 'file', 180, '');
    }
}
