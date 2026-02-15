import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

const SQL_WASM_URL = '/sql-wasm/sql-wasm.wasm';

export interface Question {
  id: number;
  question_id: string;
  category: string;
  language: string;
  question: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  correct_answer: string;
  image_id: number | null;
}

export interface ImageData {
  id: number;
  folder: string;
  data: Uint8Array;
}

let db: SqlJsDatabase | null = null;
let imageCache: Map<string, string> | null = null;
let dbInitPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  if (db) {
    console.log('Database already initialized');
    return;
  }

  console.log('Initializing database...');

  try {
    const SQL = await initSqlJs({
      locateFile: (file) => {
        console.log('Loading SQL.js file:', file);
        if (file.endsWith('.wasm')) {
          return SQL_WASM_URL;
        }
        return `/sql-wasm/${file}`;
      },
    });
    console.log('SQL.js initialized');

    const response = await fetch('/data/questions.db');
    if (!response.ok) {
      throw new Error(`Failed to fetch database: ${response.status}`);
    }
    const data = await response.arrayBuffer();
    console.log('Database loaded, size:', data.byteLength);

    db = new SQL.Database(new Uint8Array(data));
    console.log('Database created successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    dbInitPromise = null;
    throw err;
  }
}

export function getQuestionsByLanguage(language: string): Question[] {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(`
    SELECT id, question_id, category, language, question, 
           answer_a, answer_b, answer_c, correct_answer, image_id
    FROM questions 
    WHERE language = ?
  `);
  stmt.bind([language]);

  const results: Question[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      id: row.id as number,
      question_id: row.question_id as string,
      category: row.category as string,
      language: row.language as string,
      question: row.question as string,
      answer_a: row.answer_a as string,
      answer_b: row.answer_b as string,
      answer_c: row.answer_c as string,
      correct_answer: row.correct_answer as string,
      image_id: row.image_id as number | null,
    });
  }
  stmt.free();

  return results;
}

export function getQuestionsGroupedByCategory(language: string): Record<string, Question[]> {
  const questions = getQuestionsByLanguage(language);
  const grouped: Record<string, Question[]> = {};

  for (const q of questions) {
    if (!grouped[q.category]) {
      grouped[q.category] = [];
    }
    grouped[q.category].push(q);
  }

  return grouped;
}

function getImageUrl(imageId: number): string | null {
  if (!db) return null;

  const stmt = db.prepare('SELECT id, folder, data FROM images WHERE id = ?');
  stmt.bind([imageId]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    const data = row.data as Uint8Array;
    const blob = new Blob([data], { type: 'image/webp' });
    const url = URL.createObjectURL(blob);
    stmt.free();
    return url;
  }

  stmt.free();
  return null;
}

export function getImageUrlWithCache(imageId: number): string | null {
  if (!imageCache) {
    imageCache = new Map();
  }

  const cacheKey = `img_${imageId}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey) ?? null;
  }

  const url = getImageUrl(imageId);
  if (url) {
    imageCache.set(cacheKey, url);
  }
  return url;
}

export function getCategoryImageCount(language: string, category: string): number {
  if (!db) return 0;

  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM questions 
    WHERE language = ? AND category = ? AND image_id IS NOT NULL
  `);
  stmt.bind([language, category]);
  stmt.step();
  const result = stmt.getAsObject();
  stmt.free();

  return result.count as number;
}
