<?php

namespace App\Enums;

enum Concentration: string
{
    case Cologne = 'cologne';
    case Edt = 'edt';
    case Edp = 'edp';
    case Parfum = 'parfum';
    case Extrait = 'extrait';

    public function label(): string
    {
        return match ($this) {
            self::Cologne => 'Eau de Cologne',
            self::Edt => 'Eau de Toilette',
            self::Edp => 'Eau de Parfum',
            self::Parfum => 'Parfum',
            self::Extrait => 'Extrait de Parfum',
        };
    }
}
