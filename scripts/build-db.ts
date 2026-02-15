import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const dataDir = path.join(rootDir, 'src', 'data');
const imgDir = path.join(publicDir, 'img');

interface Question {
  id: string;
  q: string;
  ans: { a: string; b: string; c: string };
  v: string;
  i: number;
}

interface Catego {
  [key: string]: Question[];
}

interface LangData {
  lang: string;
  data: Catego;
}

const ro = JSON.parse(fs.readFileSync(path.join(dataDir, 'catego.json'), 'utf-8'));
const en = JSON.parse(fs.readFileSync(path.join(dataDir, 'catego-en.json'), 'utf-8'));
const de = JSON.parse(fs.readFileSync(path.join(dataDir, 'catego-de.json'), 'utf-8'));
const hu = JSON.parse(fs.readFileSync(path.join(dataDir, 'catego-hu.json'), 'utf-8'));

const languages: LangData[] = [
  { lang: 'ro', data: ro },
  { lang: 'en', data: en },
  { lang: 'de', data: de },
  { lang: 'hu', data: hu },
];

async function convertImageToWebP(inputPath: string): Promise<Buffer> {
  return sharp(inputPath).webp({ quality: 80 }).toBuffer();
}

async function buildDatabase() {
  console.log('Starting database build...');

  const dbPath = path.join(publicDir, 'data', 'questions.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id TEXT NOT NULL,
      category TEXT NOT NULL,
      language TEXT NOT NULL,
      question TEXT NOT NULL,
      answer_a TEXT NOT NULL,
      answer_b TEXT NOT NULL,
      answer_c TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      image_id INTEGER,
      UNIQUE(question_id, language)
    );
    CREATE INDEX IF NOT EXISTS idx_questions_language ON questions(language);
    CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
    
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY,
      folder TEXT NOT NULL,
      data BLOB NOT NULL
    );
  `);

  const insertQuestion = db.prepare(`
    INSERT INTO questions (question_id, category, language, question, answer_a, answer_b, answer_c, correct_answer, image_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertImage = db.prepare(`
    INSERT INTO images (id, folder, data) VALUES (?, ?, ?)
  `);

  const imagePaths = new Map<string, { id: number; folder: string; path: string }>();

  for (const { lang, data } of languages) {
    console.log(`Processing language: ${lang}`);
    let count = 0;

    for (const [category, questions] of Object.entries(data)) {
      for (const q of questions) {
        insertQuestion.run(
          q.id,
          category,
          lang,
          q.q,
          q.ans.a,
          q.ans.b,
          q.ans.c,
          q.v,
          q.i || null
        );
        count++;

        if (q.i && !imagePaths.has(`${q.i}`)) {
          const folder = category;
          const filename = `${q.i}.jpg`;
          const fullPath = path.join(imgDir, folder, filename);
          
          if (fs.existsSync(fullPath)) {
            imagePaths.set(`${q.i}`, { id: q.i, folder, path: fullPath });
          }
        }
      }
    }
    console.log(`  Inserted ${count} questions for ${lang}`);
  }

  console.log(`Converting ${imagePaths.size} images to WebP in parallel...`);
  
  const imageEntries = Array.from(imagePaths.values());
  const batchSize = 50;
  
  for (let i = 0; i < imageEntries.length; i += batchSize) {
    const batch = imageEntries.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (img) => {
        const webpData = await convertImageToWebP(img.path);
        return { id: img.id, folder: img.folder, data: webpData };
      })
    );
    
    for (const img of results) {
      insertImage.run(img.id, img.folder, img.data);
    }
    
    console.log(`  Processed ${Math.min(i + batchSize, imageEntries.length)}/${imageEntries.length} images`);
  }

  db.close();
  console.log('Database created successfully');

  const finalPath = path.join(publicDir, 'data', 'questions.db');
  fs.renameSync(dbPath, finalPath);
  
  const stats = fs.statSync(finalPath);
  console.log(`Final database size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

buildDatabase().catch(console.error);
