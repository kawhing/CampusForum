export const buildAiHistory = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map((msg) => ({ role: msg.from, content: msg.text }));
};
