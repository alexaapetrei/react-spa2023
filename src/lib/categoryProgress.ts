const CUSTOM_SET_QUESTION_PREFIX = "set:";
const LEGACY_CUSTOM_PREFIX = "custom-";

export function createCustomQuestionId(categoryKey: string, questionId: string): string {
  if (categoryKey.startsWith(LEGACY_CUSTOM_PREFIX)) {
    return `${categoryKey}-${questionId}`;
  }

  return `${CUSTOM_SET_QUESTION_PREFIX}${categoryKey}:${questionId}`;
}

export function isQuestionIdForCategory(questionId: string, categoryKey: string): boolean {
  return (
    questionId === categoryKey ||
    questionId.startsWith(`${categoryKey}-`) ||
    questionId.startsWith(`${CUSTOM_SET_QUESTION_PREFIX}${categoryKey}:`)
  );
}
