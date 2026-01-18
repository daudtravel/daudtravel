/* eslint-disable @typescript-eslint/no-explicit-any */
export const ExtractPlainText = (description?: string): string | undefined => {
  if (!description) return undefined;
  try {
    const parsed = JSON.parse(description);
    if (parsed.blocks?.length) {
      return (
        parsed.blocks
          .map((block: any) => block.text || "")
          .filter(Boolean)
          .join(" ") || undefined
      );
    }
  } catch {}
  return description.trim() || undefined;
};
