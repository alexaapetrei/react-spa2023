import type { Category, LangKeys } from "@/hooks/useCatego";
import type { CustomQuestion, LocalizedContent } from "@/lib/custom-questions-store";

function localized(value: LocalizedContent, language: LangKeys): LocalizedContent {
  const text = value.text[language] || value.text.ro || Object.values(value.text)[0] || "";
  return { text: { [language]: text }, image: value.image };
}

/** Converts one saved authoring question to the shape consumed by the quiz. */
export function toQuizQuestion(question: CustomQuestion, language: LangKeys): Category {
  return {
    id: question.id,
    q: localized(question.q, language),
    ans: Object.fromEntries(
      Object.entries(question.ans).map(([key, content]) => [key, localized(content, language)]),
    ),
    v: question.v.replaceAll(",", ""),
  };
}
