<?php

namespace App\Models\Enums;

enum LanguageEnum: string
{
    case English = 'en';
    case Bosnian = 'bs';
    case Croatian = 'hr';
    case SerbianLatin = 'sr_Latn';
    case SerbianCyrillic = 'sr_Cyrl';
    case French = 'fr';
    case German = 'de';
    case Italian = 'it';
    case Russian = 'ru';

    public function getLabel(): string
    {
        return match ($this) {
            self::English => 'English',
            self::Bosnian => 'Bosanski',
            self::Croatian => 'Hrvatski',
            self::SerbianLatin => 'Srpski',
            self::SerbianCyrillic => 'Српски',
            self::French => 'French',
            self::German => 'German',
            self::Italian => 'Italian',
            self::Russian => 'Russian',
        };
    }
}
