export const CATEGORIES = ['Study', 'Work', 'Personal', 'Fitness', 'Shopping', 'Other'] as const;
export type Category = typeof CATEGORIES[number];

export const CATEGORY_META: Record<Category, { emoji: string; color: string; label: string }> = {
  Study: { emoji: '📚', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', label: 'Study' },
  Work: { emoji: '💼', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30', label: 'Work' },
  Personal: { emoji: '👤', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30', label: 'Personal' },
  Fitness: { emoji: '🏋️', color: 'text-green-400 bg-green-500/20 border-green-500/30', label: 'Fitness' },
  Shopping: { emoji: '🛒', color: 'text-pink-400 bg-pink-500/20 border-pink-500/30', label: 'Shopping' },
  Other: { emoji: '⚪', color: 'text-gray-400 bg-gray-500/20 border-gray-500/30', label: 'Other' },
};
