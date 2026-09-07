/**
 * Basit bir CSV üretici. Excel/Google Sheets ile uyumlu olması için virgül,
 * tırnak veya satır sonu içeren alanlar çift tırnak içine alınır.
 */
export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(",")),
  ];

  // Excel'de Türkçe karakterlerin doğru görünmesi için UTF-8 BOM eklenir.
  return "﻿" + lines.join("\r\n");
}
