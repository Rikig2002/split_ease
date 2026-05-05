import React, { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { EXPENSE_CATEGORIES } from "../utils/categories";

const ExpenseFilter = ({ expenses, onFilteredExpensesChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  const filterExpenses = () => {
    let filtered = [...expenses];

    // Search by description
    if (searchTerm) {
      filtered = filtered.filter((expense) =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((expense) => expense.category === selectedCategory);
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "highest") {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === "lowest") {
      filtered.sort((a, b) => a.amount - b.amount);
    }

    onFilteredExpensesChange(filtered);
  };

  React.useEffect(() => {
    filterExpenses();
  }, [searchTerm, selectedCategory, sortBy, expenses]);

  return (
    <div className="space-y-4 rounded-2xl bg-white/5 border border-white/10 p-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search expenses..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-emerald-500 text-white"
                : "bg-white/5 border border-white/10 text-slate-300 hover:border-white/30"
            }`}
          >
            All
          </button>
          {EXPENSE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                selectedCategory === category.id
                  ? "bg-emerald-500 text-white"
                  : "bg-white/5 border border-white/10 text-slate-300 hover:border-white/30"
              }`}
            >
              {category.icon} {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Sort by</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Amount</option>
          <option value="lowest">Lowest Amount</option>
        </select>
      </div>

      {/* Clear Filters */}
      {(searchTerm || selectedCategory) && (
        <button
          onClick={() => {
            setSearchTerm("");
            setSelectedCategory(null);
          }}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="h-4 w-4" />
          Clear filters
        </button>
      )}
    </div>
  );
};

export default ExpenseFilter;
