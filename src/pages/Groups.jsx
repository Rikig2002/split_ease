import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import api from "../services/api";
import CreateGroupModal from "../components/CreateGroupModal";

const formatCurrency = (amount) => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/groups");
        const liveGroups = Array.isArray(response.data) ? response.data : [];

        const groupsWithBalances = await Promise.all(
          liveGroups.map(async (group) => {
            try {
              const expenseResponse = await api.get(`/expenses/group/${group._id}`);
              const expenses = Array.isArray(expenseResponse.data) ? expenseResponse.data : [];

              return {
                ...group,
                expenseCount: expenses.length,
                balance: expenses.length > 0 ? `${formatCurrency(expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0))} spent` : "No expenses yet",
              };
            } catch (expenseError) {
              return {
                ...group,
                expenseCount: 0,
                balance: "Balance unavailable",
              };
            }
          })
        );

        setGroups(groupsWithBalances);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "Unable to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter px-6 py-8 relative overflow-hidden">
      <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
      <main className="relative max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Your Groups</h1>
            <p className="mt-3 text-sm text-slate-400">Choose a group to view balances, expenses, and settlements.</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-medium hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Create Group
          </button>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-40 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-200">
            {error}
          </div>
        ) : groups.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => {
              const memberCount = Array.isArray(group.members) ? group.members.length : 0;

              return (
                <Link
                  key={group._id}
                  to={`/groups/${group._id}`}
                  className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(16,185,129,0.1)] transition-all duration-300 ease-out hover:scale-[1.02] hover:border-emerald-500/30"
                >
                  <h2 className="text-2xl font-semibold text-white">{group.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">{memberCount} members</p>
                  <p className="mt-6 text-lg font-semibold text-emerald-300">{group.balance}</p>
                  <p className="mt-2 text-xs text-slate-500">Tap to view group details</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center">
            <h3 className="text-2xl font-semibold text-white">No groups yet</h3>
            <p className="mt-3 text-sm text-slate-400">Create your first group to start splitting expenses.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-medium hover:shadow-lg transition-all"
            >
              <Plus className="h-5 w-5" />
              Create Group
            </button>
          </div>
        )}
      </main>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={(newGroup) => {
          setGroups([newGroup, ...groups]);
        }}
      />
    </div>
  );
};

export default Groups;
