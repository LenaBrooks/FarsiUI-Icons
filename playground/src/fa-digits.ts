const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Convert Western digits in a string/number to Persian digits. */
export function toFaDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]!);
}
