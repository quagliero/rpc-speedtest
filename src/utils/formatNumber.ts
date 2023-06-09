export function formatNumber(number: number, opts?: Intl.NumberFormatOptions) {
  return number.toLocaleString(undefined, {
    maximumSignificantDigits: 4,
    ...opts,
  });
}
