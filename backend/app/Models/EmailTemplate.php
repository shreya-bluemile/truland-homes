<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    public const QUOTATION_REQUEST = 'quotation_request';

    public const QUOTATION_REMINDER = 'quotation_reminder';

    /** Templates the system sends; they can be edited but not switched off. */
    public const SYSTEM_KEYS = [self::QUOTATION_REQUEST, self::QUOTATION_REMINDER];

    protected $fillable = ['key', 'name', 'description', 'subject', 'body', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function isSystem(): bool
    {
        return in_array($this->key, self::SYSTEM_KEYS, true);
    }
}
