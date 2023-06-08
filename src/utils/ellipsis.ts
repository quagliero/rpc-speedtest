export function ellipsis(str: string, n = 4): string {
  if (str.length <= n * 2) {
    return str; // No need to truncate
  }

  const start = str.slice(0, n);
  const end = str.slice(-n);

  return `${start}…${end}`;
}
