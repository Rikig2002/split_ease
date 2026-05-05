import React, { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ReceiptText, Wallet } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AddExpenseModal from "../components/AddExpenseModal";
import SelectGroupModal from "../components/SelectGroupModal";

const formatCurrency = (amount) => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

const getDisplayName = (user) => user?.name || user?.email || "You";

const Dashboard = () => {
  const { user } = useAuth();
  const name = getDisplayName(user);

  const [stats, setStats] = useState([
    { label: "Total Balance", value: "$0.00", tone: "text-emerald-300", icon: Wallet },
    { label: "You Owe", value: "$0.00", tone: "text-red-300", icon: ArrowDownLeft },
    { label: "You are Owed", value: "$0.00", tone: "text-emerald-300", icon: ArrowUpRight },
  ]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState([]);
  const [isSelectGroupModalOpen, setIsSelectGroupModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const groupsResponse = await api.get("/groups");
        const liveGroups = Array.isArray(groupsResponse.data) ? groupsResponse.data : [];
        setGroups(liveGroups);
        const currentUserId = user?._id || user?.id;

        if (!currentUserId) {
          setStats([
            { label: "Total Balance", value: "$0.00", tone: "text-emerald-300", icon: Wallet },
            { label: "You Owe", value: "$0.00", tone: "text-red-300", icon: ArrowDownLeft },
            { label: "You are Owed", value: "$0.00", tone: "text-emerald-300", icon: ArrowUpRight },
          ]);
          setActivities([]);
          setLoading(false);
          return;
        }

        const expensesByGroup = await Promise.all(
          liveGroups.map(async (group) => {
            const response = await api.get(`/expenses/group/${group._id}`);
            return {
              group,
              expenses: Array.isArray(response.data) ? response.data : [],
            };
          })
        );

        let youOwe = 0;
        let youAreOwed = 0;
        const allActivities = [];

        expensesByGroup.forEach(({ group, expenses }) => {
          expenses.forEach((expense) => {
            const paidById = expense.paidBy?._id || expense.paidBy;
            const splitDetails = Array.isArray(expense.splitDetails) ? expense.splitDetails : [];
            const yourShareEntry = splitDetails.find((entry) => {
              const splitUserId = entry.user?._id || entry.user;
              return splitUserId?.toString() === currentUserId.toString();
            });
            const yourShare = Number(yourShareEntry?.amount || 0);
            const amount = Number(expense.amount || 0);

            if (paidById?.toString() === currentUserId.toString()) {
              const owedByOthers = splitDetails.reduce((sum, entry) => {
                const splitUserId = entry.user?._id || entry.user;
                if (splitUserId?.toString() === currentUserId.toString()) {
                  return sum;
                }

                return sum + Number(entry.amount || 0);
              }, 0);

              youAreOwed += owedByOthers;
            } else if (yourShare > 0) {
              youOwe += yourShare;
            }

            const amountTone = paidById?.toString() === currentUserId.toString() ? "text-emerald-300" : "text-red-300";

            allActivities.push({
              id: expense._id,
              icon: "💸",
              description: expense.description || "Shared expense",
              person: `Paid by ${expense.paidBy?.name || "Unknown"}`,
              amount: paidById?.toString() === currentUserId.toString()
                ? `+${formatCurrency(amount - yourShare)}`
                : `-${formatCurrency(yourShare)}`,
              amountTone,
              createdAt: expense.createdAt,
              groupName: group.name,
            });
          });
        });

        allActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setStats([
          {
            label: "Total Balance",
            value: formatCurrency(youAreOwed - youOwe),
            tone: youAreOwed - youOwe >= 0 ? "text-emerald-300" : "text-red-300",
            icon: Wallet,
          },
          {
            label: "You Owe",
            value: formatCurrency(youOwe),
            tone: "text-red-300",
            icon: ArrowDownLeft,
          },
          {
            label: "You are Owed",
            value: formatCurrency(youAreOwed),
            tone: "text-emerald-300",
            icon: ArrowUpRight,
          },
        ]);

        setActivities(allActivities);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "Unable to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter px-6 py-8 relative overflow-hidden">
      <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute top-40 left-0 h-80 w-80 rounded-full bg-teal-400/20 blur-[120px]" />

      <main className="relative max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Welcome back, {name}
          </h1>
          <p className="mt-3 text-sm text-slate-400 max-w-2xl">
            Here’s your current balance snapshot, recent activity, and the latest expense flow across your groups.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="group relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(16,185,129,0.1)] transition-all duration-300 ease-out hover:scale-[1.02] hover:border-emerald-500/30"
            >
              <div className="absolute top-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500/25 to-teal-400/25 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.25)] transition-all duration-300 ease-out group-hover:scale-110">
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-400">{stat.label}</p>
              <div className={`mt-4 text-3xl font-bold tracking-tighter ${stat.tone}`}>
                {stat.value}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(16,185,129,0.1)] transition-all duration-300 ease-out hover:border-emerald-500/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>
              <p className="mt-2 text-sm text-slate-400">The latest expenses and settlements from your groups.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              {error}
            </div>
          ) : activities.length > 0 ? (
            <div className="divide-y divide-white/5">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 py-4 transition-all duration-300 ease-out hover:bg-white/5 rounded-xl px-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-lg shadow-[0_0_24px_rgba(16,185,129,0.25)]">
                    <ReceiptText className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{activity.description}</p>
                    <p className="text-sm text-slate-400">{activity.person}</p>
                  </div>
                  <div className={`text-right text-base font-semibold ${activity.amountTone}`}>
                    <p>{activity.amount}</p>
                    <p className="text-xs text-slate-500">{activity.groupName}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                <ReceiptText className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-white">No recent activity yet</h3>
              <p className="mt-3 text-sm text-slate-400">
                Once your groups start adding expenses, they’ll appear here with live balances.
              </p>
            </div>
          )}
        </section>
      </main>

      <button
        type="button"
        onClick={() => {
          if (groups.length === 0) {
            // Show message or navigate to groups page
            window.location.href = "/groups";
          } else {
            setIsSelectGroupModalOpen(true);
          }
        }}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-3xl font-bold shadow-[0_0_28px_rgba(16,185,129,0.35)] transition-all duration-300 ease-out hover:scale-[1.05] hover:shadow-[0_0_36px_rgba(16,185,129,0.5)]"
        aria-label="Add expense"
      >
        +
      </button>

      <SelectGroupModal
        isOpen={isSelectGroupModalOpen}
        onClose={() => setIsSelectGroupModalOpen(false)}
        groups={groups}
        onGroupSelected={(groupId) => {
          setSelectedGroupId(groupId);
          setIsAddExpenseModalOpen(true);
        }}
      />

      {selectedGroupId && (
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
          groupId={selectedGroupId}
          onExpenseAdded={() => {
            // Refresh dashboard data
            setIsAddExpenseModalOpen(false);
            setSelectedGroupId(null);
            // Optionally refresh data
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
