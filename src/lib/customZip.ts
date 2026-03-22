import JSZip from "jszip";
import { getQuestionsForSet, getSetsForLang, saveSet, saveQuestion } from "./customStore";
import type { Category } from "../hooks/useCatego";

export async function exportSetAsZip(setId: string): Promise<void> {
  const setsTable = (await import("./customStore")).store.getTable("sets") as Record<
    string,
    Record<string, unknown>
  >;
  const setRow = setsTable[setId];
  const setName = (setRow?.name as string) ?? "custom-set";

  const questions = getQuestionsForSet(setId);

  const zip = new JSZip();

  const categoriesForJson: Category[] = questions.map((row) => {
    const ans: Record<string, string> = {};
    const answerKeys = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;
    for (const key of answerKeys) {
      if (row[key] !== undefined && row[key] !== "") {
        ans[key] = row[key] as string;
      }
    }
    return {
      id: row.id,
      q: row.q,
      ans,
      v: row.v,
    };
  });

  zip.file("questions.json", JSON.stringify(categoriesForJson, null, 2));

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
  const categories: Category[] = JSON.parse(questionsJson);

  const setId = saveSet({ name: setName, lang, categoryKey });

  let count = 0;
  for (let idx = 0; idx < categories.length; idx++) {
    const cat = categories[idx];
    const row: Parameters<typeof saveQuestion>[1] = {
      q: cat.q,
      v: cat.v,
      ...cat.ans,
    };

    // Try to find image for this question (1-based index)
    const n = idx + 1;
    const exts = ["jpg", "jpeg", "png", "webp", "gif"];
    for (const ext of exts) {
      const imgFile = zip.file(`images/${n}.${ext}`);
      if (imgFile) {
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
        break;
      }
    }

    saveQuestion(setId, row);
    count++;
  }

  return count;
}

// Re-export for use in pages
export { getSetsForLang };
