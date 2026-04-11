const LEGACY_CUSTOM_PREFIX = "custom-";
const BUILT_IN_CATEGORY_KEYS = new Set(["a", "b", "c", "d", "e", "r", "t", "dan"]);

export function slugifyCustomCategoryName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "set"
  );
}

export function normalizeLegacyCustomCategoryKey(categoryKey: string, setName?: string): string {
  if (!categoryKey.startsWith(LEGACY_CUSTOM_PREFIX)) {
    return categoryKey;
  }

  if (setName && categoryKey !== `${LEGACY_CUSTOM_PREFIX}${slugifyCustomCategoryName(setName)}`) {
    return categoryKey;
  }

  return categoryKey.slice(LEGACY_CUSTOM_PREFIX.length);
}

export function hasCustomCategoryKeyCollision(
  existingKeys: string[],
  categoryKey: string,
  excludeKey?: string,
): boolean {
  const normalizedCategoryKey = normalizeLegacyCustomCategoryKey(categoryKey);

  if (BUILT_IN_CATEGORY_KEYS.has(normalizedCategoryKey)) {
    return true;
  }

  return existingKeys.some((existingKey) => {
    if (excludeKey && existingKey === excludeKey) return false;
    return normalizeLegacyCustomCategoryKey(existingKey) === normalizedCategoryKey;
  });
}
