export const buildAiHistory = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items.map(({ from: sender, text: message }) => ({ role: sender, content: message }));
};
