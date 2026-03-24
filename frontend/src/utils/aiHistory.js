export const buildAiHistory = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map(({ from: sender, text: message }) => {
      if (!message) return null;
      if (sender === 'assistant') return { role: 'assistant', content: message };
      if (sender === 'user') return { role: 'user', content: message };
      return null;
    })
    .filter(Boolean);
};
