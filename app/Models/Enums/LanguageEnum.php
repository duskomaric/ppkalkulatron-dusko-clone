<?php

namespace App\Models\Enums;

enum LanguageEnum: string
{
    case English = 'en';
    case SerbianLatin = 'sr-Latn';
    case SerbianCyrillic = 'sr-Cyrl';
    case French = 'fr';
    case German = 'de';
    case Italian = 'it';
    case Russian = 'ru';

    public function getLabel(): string
    {
        return match ($this) {
            self::English => 'English',
            self::SerbianLatin => 'Serbian (Latin)',
            self::SerbianCyrillic => 'Serbian (Cyrillic)',
            self::French => 'French',
            self::German => 'German',
            self::Italian => 'Italian',
            self::Russian => 'Russian',
        };
    }
}
