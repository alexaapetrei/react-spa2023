import JSZip from "jszip";
import {
  getQuestionsForSet,
  getSetsForLang,
  getSetById,
  saveSet,
  saveQuestion,
} from "./customStore";
import { normalizeLegacyCustomCategoryKey } from "./customCategory";

export async function exportSetAsZip(setId: string): Promise<void> {
  const setRow = getSetById(setId);
  const setName = setRow?.name ?? "set";

  const questions = getQuestionsForSet(setId);

  const zip = new JSZip();

  const exportQuestions = questions.map((row, idx) => {
    const ans: Record<string, string> = {};
    const answerKeys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
    for (const key of answerKeys) {
      if (row[key] !== undefined && row[key] !== "") {
        ans[key] = row[key] as string;
      }
    }

    const image = row.imageData ? `${idx + 1}.${row.imageExt ?? "jpg"}` : undefined;

    return {
      id: String(idx + 1),
      q: row.q,
      ans,
      v: row.v,
      ...(image ? { image } : {}),
    };
  });

  zip.file(
    "questions.json",
    JSON.stringify(
      {
        setName,
        language: setRow?.lang ?? "ro",
        category: setRow?.categoryKey
          ? normalizeLegacyCustomCategoryKey(setRow.categoryKey, setName)
          : "set",
        questions: exportQuestions,
      },
      null,
      2,
    ),
  );

  const imagesFolder = zip.folder("images")!;

  questions.forEach((row, idx) => {
    if (row.imageData) {
      const ext = row.imageExt ?? "jpg";
      // imageData is a data URL: "data:image/jpeg;base64,<base64data>"
      const base64Data = row.imageData.split(",")[1];
      if (base64Data) {
        imagesFolder.file(`${idx + 1}.${ext}`, base64Data, { base64: true });
      }
    }
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${setName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function previewZip(file: File): Promise<{
  count: number;
  setName?: string;
  questions: Array<{ q: string; v: string; [key: string]: unknown }>;
}> {
  const zip = await JSZip.loadAsync(file);
  const questionsFile = zip.file("questions.json");
  if (!questionsFile) throw new Error("questions.json not found in ZIP");

  const questionsJson = await questionsFile.async("string");
  const manifest = JSON.parse(questionsJson);
  return {
    count: Array.isArray(manifest.questions) ? manifest.questions.length : 0,
    setName: manifest.setName,
    questions: manifest.questions || [],
  };
}

export async function importFromZip(
  file: File,
  lang: string,
  setName: string,
  categoryKey: string,
): Promise<number> {
  const zip = await JSZip.loadAsync(file);

  const questionsFile = zip.file("questions.json");
  if (!questionsFile) throw new Error("questions.json not found in ZIP");

  const questionsJson = await questionsFile.async("string");
  const manifest = JSON.parse(questionsJson) as {
    setName?: string;
    language?: string;
    category?: string | string[];
    questions?: Array<{
      q: string;
      v: string;
      ans?: Record<string, string>;
      image?: string;
    }>;
  };

  if (!Array.isArray(manifest.questions)) {
    throw new Error("questions.json must contain a questions array");
  }

  const resolvedLang = ["ro", "en", "de", "hu"].includes(manifest.language ?? "")
    ? (manifest.language as string)
    : lang;
  const resolvedSetName = setName || manifest.setName;
  const resolvedCategory = normalizeLegacyCustomCategoryKey(
    Array.isArray(manifest.category)
      ? manifest.category[0] || categoryKey
      : manifest.category || categoryKey,
    resolvedSetName,
  );

  const setId = saveSet({
    name: resolvedSetName,
    lang: resolvedLang,
    categoryKey: resolvedCategory,
  });

  let count = 0;
  for (let idx = 0; idx < manifest.questions.length; idx++) {
    const cat = manifest.questions[idx];
    const row: Parameters<typeof saveQuestion>[1] = {
      q: cat.q,
      v: cat.v,
    };
    if (cat.ans) {
      for (const [key, val] of Object.entries(cat.ans)) {
        if (val) {
          (row as Record<string, string>)[key] = val;
        }
      }
    }

    if (cat.image) {
      const imgFile = zip.file(`images/${cat.image}`);
      if (imgFile) {
        const ext = cat.image.split(".").pop()?.toLowerCase() ?? "jpg";
        const base64 = await imgFile.async("base64");
        const mime =
          ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : ext === "png"
              ? "image/png"
              : ext === "webp"
                ? "image/webp"
                : "image/gif";
        row.imageData = `data:${mime};base64,${base64}`;
        row.imageExt = ext;
      }
    }

    saveQuestion(setId, row);
    count++;
  }

  return count;
}

// Re-export for use in pages
export { getSetsForLang };
