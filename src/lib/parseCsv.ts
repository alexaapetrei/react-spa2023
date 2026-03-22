import type { QuestionRow } from "./customStore";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseCsv(text: string): Partial<QuestionRow>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  const idIdx = headers.indexOf("id");
  const questionIdx = headers.indexOf("question");
  const correctIdx = headers.indexOf("correct");
  const answerKeys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

  const answerIdxMap: Record<string, number> = {};
  for (const key of answerKeys) {
    const idx = headers.indexOf(key);
    if (idx !== -1) answerIdxMap[key] = idx;
  }

  const results: Partial<QuestionRow>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.every((c) => c.trim() === "")) continue;

    const row: Partial<QuestionRow> = {};

    if (questionIdx !== -1 && cols[questionIdx]?.trim()) {
      row.q = cols[questionIdx].trim();
    }

    if (correctIdx !== -1 && cols[correctIdx]?.trim()) {
      row.v = cols[correctIdx].trim();
    }

    for (const [key, idx] of Object.entries(answerIdxMap)) {
      const val = cols[idx]?.trim();
      if (val) {
        (row as Record<string, string>)[key] = val;
      }
    }

    // id column is optional
    if (idIdx !== -1 && cols[idIdx]?.trim()) {
      // We don't set id on QuestionRow, the store generates it
    }

    if (row.q && row.v) {
      results.push(row);
    }
  }

  return results;
}
