export interface CsvColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => string;
}

const MAX_ROWS = 1000;

export function toCSV<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const body = rows.slice(0, MAX_ROWS).map(row => {
    return columns.map(c => {
      const raw = c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '');
      return `"${String(raw).replace(/"/g, '""')}"`;
    }).join(',');
  }).join('\n');
  return `${header}\n${body}`;
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { MAX_ROWS as CSV_MAX_ROWS };
