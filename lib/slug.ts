export function slugify(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  if (!cleaned) {
    return `item-${Date.now()}`;
  }

  return cleaned;
}
