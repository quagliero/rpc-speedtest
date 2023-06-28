export function getOrdinal(number: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const suffixIndex = number % 100;

  return (
    number +
    (suffixes[(suffixIndex - 20) % 10] || suffixes[suffixIndex] || suffixes[0])
  );
}
