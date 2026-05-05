import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Clock } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import AddExpenseModal from "../components/AddExpenseModal";
import ExpenseFilter from "../components/ExpenseFilter";
import GroupChat from "../components/GroupChat";
import { getCategoryIcon } from "../utils/categories";

const formatCurrency = (amount) => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

const uniqueMembers = (members) => {
  const seen = new Set();

  return (Array.isArray(members) ? members : []).filter((member) => {
    const memberUser = member?.user || member;
    const memberId = memberUser?._id || memberUser?.id || memberUser?.toString?.();

    if (!memberId) {
      return false;
    }

    const normalized = memberId.toString();
    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
};

const INVITE_CAPACITY_OPTIONS = [1, 2, 3, 4, 5, 10];

const GroupDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [settleItems, setSettleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settlingId, setSettlingId] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [inviteCapacity, setInviteCapacity] = useState(1);
  const [invites, setInvites] = useState([]);
  const [revokingId, setRevokingId] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState("");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const currentUserId = useMemo(() => user?._id || user?.id, [user]);

  const fetchGroupDetail = async () => {
    try {
      setLoading(true);
      setError("");

      const [groupResponse, expensesResponse, settleResponse, invitesResponse] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/expenses/group/${id}`),
        api.get(`/groups/${id}/settle-up`),
        api.get(`/groups/${id}/invites`),
      ]);

      setGroup(groupResponse.data);
      setExpenses(Array.isArray(expensesResponse.data) ? expensesResponse.data : []);
      setSettleItems(Array.isArray(settleResponse.data) ? settleResponse.data : []);
      setInvites(Array.isArray(invitesResponse.data) ? invitesResponse.data : []);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Unable to load group details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchGroupDetail();
    }
  }, [id]);

  const handleMarkAsPaid = async (settlementId) => {
    try {
      setSettlingId(settlementId);
      await api.patch(`/groups/settlement/${settlementId}/mark-paid`);
      toast.success("Settlement marked as paid!");
      fetchGroupDetail();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark settlement");
    } finally {
      setSettlingId(null);
    }
  };

  const handleCreateInviteLink = async () => {
    try {
      setCreatingLink(true);
      const res = await api.post(`/groups/${id}/invite`, {
        maxUses: inviteCapacity,
      });
      const nextLink = res.data.url || "";

      setInviteLink(nextLink);

      try {
        await navigator.clipboard.writeText(nextLink);
      } catch (clipboardError) {
        // Clipboard access can fail on some browsers; the link remains visible below.
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${group?.name || "SplitEase"} invite`,
            text: `Join ${group?.name || "our group"} on SplitEase`,
            url: nextLink,
          });
        } catch (shareError) {
          // Ignore share cancellations.
        }
      }

      toast.success("Invite link ready");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create invite link");
    } finally {
      setCreatingLink(false);
    }
  };

  const handleAddExtraSlot = async () => {
    const nextCapacity = Math.min((Number(inviteCapacity) || 1) + 1, 100);

    setInviteCapacity(nextCapacity);
    await handleCreateInviteLinkWithCapacity(nextCapacity);
  };

  const handleDeleteGroup = async () => {
    const confirmed = window.confirm(
      "Delete this group and all of its expenses, chats, invites, and settlements? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingGroup(true);
      await api.delete(`/groups/${id}`);
      toast.success("Group deleted successfully");
      window.location.href = "/groups";
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete group");
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    const confirmed = window.confirm(`Remove ${memberName} from this group?`);

    if (!confirmed) {
      return;
    }

    try {
      setRemovingMemberId(memberId);
      const res = await api.delete(`/groups/${id}/members/${memberId}`);
      setGroup(res.data);
      toast.success(`${memberName} removed from group`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    } finally {
      setRemovingMemberId("");
    }
  };

  const isExpenseEditable = (expense) => {
    const expenseCreatedBy = expense?.createdBy?._id || expense?.createdBy;
    const expensePaidBy = expense?.paidBy?._id || expense?.paidBy;
    const groupCreator = group?.createdBy;

    return [expenseCreatedBy, expensePaidBy, groupCreator]
      .filter(Boolean)
      .some((value) => value.toString() === currentUserId?.toString());
  };

  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    setExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleRemoveExpense = async (expenseId, expenseName) => {
    const confirmed = window.confirm(`Delete expense "${expenseName}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success("Expense deleted successfully");
      fetchGroupDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete expense");
    }
  };

  const handleCreateInviteLinkWithCapacity = async (capacity) => {
    try {
      setCreatingLink(true);
      const res = await api.post(`/groups/${id}/invite`, {
        maxUses: capacity,
      });
      const nextLink = res.data.url || "";

      setInviteLink(nextLink);

      try {
        await navigator.clipboard.writeText(nextLink);
      } catch (clipboardError) {
        // Clipboard access can fail on some browsers; the link remains visible below.
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${group?.name || "SplitEase"} invite`,
            text: `Join ${group?.name || "our group"} on SplitEase`,
            url: nextLink,
          });
        } catch (shareError) {
          // Ignore share cancellations.
        }
      }

      toast.success(`Invite link ready for ${capacity} ${capacity === 1 ? "person" : "people"}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create invite link");
    } finally {
      setCreatingLink(false);
    }
  };

  const hasExpenses = filteredExpenses.length > 0;
  const memberList = uniqueMembers(group?.members);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-inter px-6 py-8 flex items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 backdrop-blur-xl">
          Loading group details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-inter px-6 py-8">
        <div className="max-w-6xl mx-auto rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter px-6 py-8 relative overflow-hidden">
      <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute top-48 left-0 h-72 w-72 rounded-full bg-teal-400/20 blur-[120px]" />

      <main className="relative max-w-6xl mx-auto space-y-8">
        {/* Group Header */}
        <section className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            {group?.name || "Group Details"}
          </h1>

          {group?.createdBy && currentUserId && group.createdBy.toString?.() === currentUserId.toString() && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={deletingGroup}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition-all duration-300 ease-out hover:bg-red-500/20 disabled:opacity-50"
              >
                {deletingGroup ? "Deleting..." : "Delete Group"}
              </button>
            </div>
          )}

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex items-center gap-4 min-w-max">
              {memberList.map((member) => {
                const memberUser = member.user || member;
                const memberId = memberUser?._id || memberUser?.id || memberUser?.toString?.();
                const displayName = memberUser?.name || "Unknown";
                const isCurrentUser = currentUserId && memberId?.toString() === currentUserId.toString();
                const canRemoveMember =
                  group?.createdBy &&
                  currentUserId &&
                  group.createdBy.toString?.() === currentUserId.toString() &&
                  !isCurrentUser;

                return (
                  <div key={memberId || displayName} className="relative flex flex-col items-center gap-2">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white/5 text-lg font-bold text-white ${
                        isCurrentUser ? "border-emerald-500" : "border-white/20"
                      }`}
                    >
                      {(displayName || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-400">{displayName}</span>
                    {canRemoveMember && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(memberId, displayName)}
                        disabled={removingMemberId === memberId}
                        className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {removingMemberId === memberId ? "Removing..." : "Remove"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="email"
                placeholder="Invite member by email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400"
              />
              <button
                onClick={async () => {
                  if (!inviteEmail) return toast.error("Enter an email to invite");
                  try {
                    setInviting(true);
                    const res = await api.post(`/groups/${id}/members`, { email: inviteEmail });
                    setGroup(res.data);
                    setInviteEmail("");
                    toast.success("Member added to group");
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Failed to add member");
                  } finally {
                    setInviting(false);
                  }
                }}
                disabled={inviting}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {inviting ? "Inviting..." : "Invite"}
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  Link capacity
                </label>
                <div className="flex flex-wrap gap-2">
                  {INVITE_CAPACITY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setInviteCapacity(option);
                        handleCreateInviteLinkWithCapacity(option);
                      }}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out ${
                        inviteCapacity === option
                          ? "bg-emerald-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {option} {option === 1 ? "person" : "people"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleCreateInviteLinkWithCapacity(inviteCapacity)}
                disabled={creatingLink}
                className="rounded-xl bg-teal-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {creatingLink ? "Creating..." : inviteLink ? "Refresh Invite Link" : "Create Invite Link"}
              </button>

              <button
                onClick={handleAddExtraSlot}
                disabled={creatingLink}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50"
              >
                Add Extra Member
              </button>

              {inviteLink && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inviteLink);
                        toast.success("Invite link copied");
                      } catch (err) {
                        toast.error("Could not copy the invite link");
                      }
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200"
                  >
                    Copy Link
                  </button>

                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-slate-300 underline"
                  >
                    Open invite
                  </a>
                </>
              )}
            </div>

            {inviteLink && (
              <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-300 break-all">
                {inviteLink}
              </div>
            )}
            {invites.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm text-slate-300 mb-2">Active invites</h4>
                <div className="space-y-2">
                  {invites.map((inv) => (
                    <div key={inv._id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <div>
                        <div className="text-sm text-slate-200">{inv.email || 'Anyone with link'}</div>
                              <div className="text-xs text-slate-400">
                                Uses: {inv.usesCount || 0}/{inv.maxUses || 1} • Expires: {new Date(inv.expiresAt).toLocaleString()}
                              </div>
                              {inv.acceptedBy && inv.acceptedBy.length > 0 && (
                                <div className="text-xs text-emerald-400 mt-1">
                                  Joined by: {inv.acceptedBy.map(a => a.user?.name || a.user?.email || 'Unknown').join(', ')}
                                </div>
                              )}
                      </div>
                      <div className="flex items-center gap-2">
                              <div className="text-sm text-slate-400">{inv.used ? 'Full' : 'Active'}</div>
                        {!inv.used && (
                          <button
                            onClick={async () => {
                              try {
                                setRevokingId(inv._id);
                                await api.delete(`/groups/${id}/invite/${inv._id}`);
                                toast.success('Invite revoked');
                                // refresh invites
                                const res = await api.get(`/groups/${id}/invites`);
                                setInvites(res.data || []);
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Failed to revoke');
                              } finally {
                                setRevokingId(null);
                              }
                            }}
                            disabled={revokingId === inv._id}
                            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium"
                          >
                            {revokingId === inv._id ? 'Revoking...' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <GroupChat groupId={id} />

        {/* Analytics Dashboard */}
        <AnalyticsDashboard groupId={id} />

        {/* Settle Up Section */}
        <section className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(16,185,129,0.15)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Settle Up</h2>
              <p className="mt-2 text-sm text-slate-400">Quickly close balances between group members.</p>
            </div>
          </div>

          <div className="space-y-3">
            {settleItems.length > 0 ? (
              settleItems.map((item, index) => (
                <div
                  key={`${item.from}-${item.to}-${index}`}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-white font-medium">
                      <span className="text-slate-400">{item.from?.name || item.from || "Someone"}</span> pays{' '}
                      <span className="text-emerald-300">{item.to?.name || item.to || "someone"}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.status === "settled" ? "✓ Already settled" : "Pending payment"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-white">{formatCurrency(Number(item.amount || 0))}</span>
                    {item.status !== "settled" ? (
                      <button
                        onClick={() => handleMarkAsPaid(item._id)}
                        disabled={settlingId === item._id}
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50"
                      >
                        {settlingId === item._id ? "Settling..." : "Mark Paid"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span className="text-sm text-emerald-300 font-medium">Settled</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-8 text-center">
                <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-400">No pending settlements</p>
              </div>
            )}
          </div>
        </section>

        {/* Expenses Section */}
        <section className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Expenses</h2>
              <p className="mt-2 text-sm text-slate-400">A clean, grouped look at every shared spend.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewExpense}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
            >
              Add Expense
            </button>
          </div>

          {expenses.length > 0 && <ExpenseFilter expenses={expenses} onFilteredExpensesChange={setFilteredExpenses} />}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              {error}
            </div>
          ) : hasExpenses ? (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => {
                const paidById = expense.paidBy?._id || expense.paidBy;
                const paidByName = expense.paidBy?.name || "Unknown";
                const splitDetails = Array.isArray(expense.splitDetails) ? expense.splitDetails : [];
                const yourShareEntry = splitDetails.find((entry) => {
                  const splitUserId = entry.user?._id || entry.user;
                  return currentUserId && splitUserId?.toString() === currentUserId.toString();
                });
                const yourShare = Number(yourShareEntry?.amount || 0);
                const amount = Number(expense.amount || 0);
                const netAmount = paidById?.toString() === currentUserId?.toString() ? amount - yourShare : yourShare;

                return (
                  <div
                    key={expense._id}
                    className="flex items-center gap-4 rounded-2xl bg-white/5 px-4 py-4 transition-all duration-300 ease-out hover:bg-white/10 border border-white/10 hover:border-emerald-500/30"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 p-2 text-lg">
                      {getCategoryIcon(expense.category) || "💸"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-white font-medium">{expense.description || "Shared expense"}</p>
                      <p className="text-sm text-slate-400">
                        Paid by {paidByName} • {expense.category || "Other"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`text-lg font-semibold ${paidById?.toString() === currentUserId?.toString() ? "text-emerald-300" : "text-red-300"}`}>
                        {paidById?.toString() === currentUserId?.toString() ? `+${formatCurrency(netAmount)}` : `-${formatCurrency(netAmount)}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        Your share: {formatCurrency(yourShare)}
                      </p>
                      {isExpenseEditable(expense) && (
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditExpense(expense)}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveExpense(expense._id, expense.description || "shared expense")}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 text-2xl shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                ✦
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-white">No expenses yet</h3>
              <p className="mt-3 max-w-md text-sm text-slate-400">
                This group is ready for its first shared expense. Add one to start tracking balances and settlements.
              </p>
            </div>
          )}
        </section>
      </main>

      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        groupId={id}
        expenseToEdit={editingExpense}
        onExpenseAdded={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
          fetchGroupDetail();
        }}
      />
    </div>
  );
};

export default GroupDetail;
