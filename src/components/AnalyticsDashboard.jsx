import React, { useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, BarChart3 } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { getCategoryLabel } from "../utils/categories";

const formatCurrency = (amount) => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

const AnalyticsDashboard = ({ groupId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [groupId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/groups/${groupId}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="mb-8 space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Expenses</p>
              <p className="text-2xl font-bold text-white mt-1">{analytics.totalExpenses}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Amount</p>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{formatCurrency(analytics.totalAmount)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Average Expense</p>
              <p className="text-2xl font-bold text-purple-300 mt-1">{formatCurrency(analytics.averageExpense)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-purple-300">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Top Category</p>
              <p className="text-lg font-bold text-pink-300 mt-1">
                {getCategoryLabel(analytics.topCategories[0]?.category) || "—"}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/20 text-pink-300">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      {analytics.topCategories.length > 0 && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Top Spending Categories</h3>
          <div className="space-y-3">
            {analytics.topCategories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-400 text-sm">{getCategoryLabel(cat.category)}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full"
                      style={{
                        width: `${(cat.amount / analytics.totalAmount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-white font-semibold">{formatCurrency(cat.amount)}</p>
                  <p className="text-xs text-slate-400">
                    {((cat.amount / analytics.totalAmount) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Payers */}
      {analytics.topPayers.length > 0 && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">Top Payers</h3>
          <div className="space-y-3">
            {analytics.topPayers.map((payer, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold text-sm">
                    {payer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium">{payer.name}</span>
                </div>
                <span className="text-emerald-300 font-semibold">{formatCurrency(payer.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
