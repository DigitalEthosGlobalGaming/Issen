const KANJI_DIGITS = '〇一二三四五六七八九';
export const kanji = (value: number): string =>
  value <= 0
    ? '〇'
    : value < 10
      ? KANJI_DIGITS[value]!
      : value === 10
        ? '十'
        : value < 20
          ? '十' + KANJI_DIGITS[value - 10]
          : value < 100
            ? KANJI_DIGITS[(value / 10) | 0] + '十' + (value % 10 ? KANJI_DIGITS[value % 10] : '')
            : String(value);
export const roman = (value: number): string =>
  ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][value] || String(value);
