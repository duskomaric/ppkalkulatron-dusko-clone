<?php

namespace App\Models\Enums;

enum DocumentTemplateEnum: string
{
    case Classic = 'classic';
    case Modern = 'modern';
    case Minimal = 'minimal';

    public function getLabel(): string
    {
        return match ($this) {
            self::Classic => 'Classic',
            self::Modern => 'Modern',
            self::Minimal => 'Minimal',
        };
    }

    public function getViewName(): string
    {
        return match ($this) {
            self::Classic => 'pdf.invoice',
            self::Modern => 'pdf.invoice-modern',
            self::Minimal => 'pdf.invoice-minimal',
        };
    }
}
