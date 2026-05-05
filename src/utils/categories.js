export const EXPENSE_CATEGORIES = [
  { id: "meals", label: "Meals", icon: "🍽️", color: "from-orange-500 to-red-500" },
  { id: "transport", label: "Transport", icon: "🚕", color: "from-blue-500 to-cyan-500" },
  { id: "entertainment", label: "Entertainment", icon: "🎬", color: "from-purple-500 to-pink-500" },
  { id: "lodging", label: "Lodging", icon: "🏨", color: "from-amber-500 to-orange-500" },
  { id: "shopping", label: "Shopping", icon: "🛍️", color: "from-pink-500 to-rose-500" },
  { id: "utilities", label: "Utilities", icon: "⚡", color: "from-yellow-500 to-amber-500" },
  { id: "entertainment-events", label: "Events", icon: "🎉", color: "from-indigo-500 to-purple-500" },
  { id: "medical", label: "Medical", icon: "🏥", color: "from-red-500 to-rose-500" },
  { id: "education", label: "Education", icon: "📚", color: "from-green-500 to-emerald-500" },
  { id: "other", label: "Other", icon: "💰", color: "from-slate-500 to-gray-500" },
];

export const getCategoryIcon = (categoryId) => {
  const category = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);
  return category?.icon || "💰";
};

export const getCategoryLabel = (categoryId) => {
  const category = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);
  return category?.label || "Other";
};

export const getCategoryColor = (categoryId) => {
  const category = EXPENSE_CATEGORIES.find((c) => c.id === categoryId);
  return category?.color || "from-slate-500 to-gray-500";
};
