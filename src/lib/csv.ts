const FORMULA_PREFIX = /^[\t\r ]*[=+\-@]/;

export function csvCell(value: unknown) {
  let text = value instanceof Date ? value.toISOString() : value == null ? "" : String(value);
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createCsv(headers: string[], rows: unknown[][]) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
