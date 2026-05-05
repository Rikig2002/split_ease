import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { EXPENSE_CATEGORIES } from "../utils/categories";

const uniqueMembers = (members) => {
  const seen = new Set();

  return (Array.isArray(members) ? members : []).filter((member) => {
    const memberId = member?.user?._id?.toString?.() || member?.user?.toString?.();

    if (!memberId || seen.has(memberId)) {
      return false;
    }

    seen.add(memberId);
    return true;
  });
};

const getMemberId = (member) => member?.user?._id?.toString?.() || member?.user?.toString?.() || "";

const getExpenseMemberIds = (expense) => {
  const splitAmongIds = Array.isArray(expense?.splitAmong)
    ? expense.splitAmong.map((member) => member?._id?.toString?.() || member?.toString?.()).filter(Boolean)
    : [];

  if (splitAmongIds.length > 0) {
    return splitAmongIds;
  }

  const splitDetailIds = Array.isArray(expense?.splitDetails)
    ? expense.splitDetails
        .map((entry) => entry?.user?._id?.toString?.() || entry?.user?.toString?.())
        .filter(Boolean)
    : [];

  return splitDetailIds;
};

const AddExpenseModal = ({ isOpen, onClose, groupId, onExpenseAdded, expenseToEdit = null }) => {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("meals");
  const [paidBy, setPaidBy] = useState("");
  const [splitAmong, setSplitAmong] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [splitDetailsInput, setSplitDetailsInput] = useState({});
  const [loading, setLoading] = useState(false);
  const memberList = uniqueMembers(group?.members);
  const isEditing = Boolean(expenseToEdit?._id);

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroupDetails();
    }
  }, [isOpen, groupId]);

  const fetchGroupDetails = async () => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      setGroup(response.data);
      const memberIds = uniqueMembers(response.data.members)
        .map((member) => member.user?._id?.toString?.() || member.user?._id)
        .filter(Boolean);

      if (isEditing) {
        setDescription(expenseToEdit.description || "");
        setAmount(String(expenseToEdit.amount ?? ""));
        setCategory(expenseToEdit.category || "meals");
        setPaidBy(expenseToEdit.paidBy?._id?.toString?.() || expenseToEdit.paidBy?.toString?.() || "");
        setSplitAmong(getExpenseMemberIds(expenseToEdit));
        setSplitType(expenseToEdit.splitType || "equal");
        const details = {};
        (expenseToEdit.splitDetails || []).forEach((d) => {
          const id = d?.user?._id?.toString?.() || d?.user?.toString?.();
          if (id) details[id] = String(d.amount);
        });
        setSplitDetailsInput(details);
      } else {
        setDescription("");
        setAmount("");
        setCategory("meals");
        setSplitAmong(memberIds);
        const currentUserMember = uniqueMembers(response.data.members).find(
          (m) => m.user._id?.toString?.() === user._id?.toString?.()
        );
        if (currentUserMember) {
          setPaidBy(user._id);
        } else {
          setPaidBy("");
        }
      }
    } catch (error) {
      toast.error("Failed to load group details");
    }
  };

  const handleToggleSplitAmong = (memberId) => {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim() || !amount || !paidBy || splitAmong.length === 0) {
      toast.error("Please fill in all fields and select at least one person to split among");
      return;
    }

    try {
      setLoading(true);
      if (splitType === "unequal") {
        const totalCents = Math.round(parseFloat(amount) * 100);
        const sumCents = Object.keys(splitDetailsInput || {}).reduce((s, k) => s + Math.round((parseFloat(splitDetailsInput[k] || 0) || 0) * 100), 0);
        if (sumCents !== totalCents) {
          toast.error("Split amounts must sum to the total amount");
          setLoading(false);
          return;
        }
      }
      const payload = {
        group: groupId,
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        paidBy,
        splitAmong,
        splitType,
        splitDetails: splitType === "unequal"
          ? Object.keys(splitDetailsInput).map((userId) => ({ user: userId, amount: parseFloat(splitDetailsInput[userId] || 0) }))
          : undefined,
      };

      const response = isEditing
        ? await api.patch(`/expenses/${expenseToEdit._id}`, payload)
        : await api.post("/expenses/group/" + groupId, payload);

      toast.success(isEditing ? "Expense updated successfully!" : "Expense added successfully!");
      setDescription("");
      setAmount("");
      setCategory("meals");
      setPaidBy(user._id || "");
      setSplitAmong([]);
      onClose();
      if (onExpenseAdded) {
        onExpenseAdded(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{isEditing ? "Edit Expense" : "Add Expense"}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {isEditing ? "Update the shared expense details" : `Record a shared expense for ${group.name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="e.g., Dinner at Italian Place"
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  disabled={loading}
                  className={`p-3 rounded-lg transition-all ${
                    category === cat.id
                      ? "bg-gradient-to-r " + cat.color + " border-2 border-white"
                      : "bg-white/5 border border-white/10 hover:border-white/20"
                  } text-2xl font-bold disabled:opacity-50`}
                  title={cat.label}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Selected: {EXPENSE_CATEGORIES.find((c) => c.id === category)?.label}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-lg font-bold disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Paid by</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
            >
              <option value="">Select who paid</option>
              {memberList.map((member) => (
                <option key={member.user._id} value={member.user._id}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Split among</label>
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="splitType" value="equal" checked={splitType === "equal"} onChange={() => setSplitType("equal")} /> Equal
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="splitType" value="unequal" checked={splitType === "unequal"} onChange={() => setSplitType("unequal")} /> Unequal
              </label>
            </div>
            <div className="grid gap-2">
              {memberList.map((member) => (
                <label
                  key={member.user._id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  <input
                    type="checkbox"
                    checked={splitAmong.includes(member.user._id)}
                    onChange={() => handleToggleSplitAmong(member.user._id)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  <span className="text-sm text-white">{member.user.name}</span>
                  {splitType === "unequal" && (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={splitDetailsInput[member.user._id] || ""}
                      onChange={(e) => setSplitDetailsInput((p) => ({ ...p, [member.user._id]: e.target.value }))}
                      placeholder="0.00"
                      className="ml-auto w-28 px-2 py-1 rounded bg-white/5 text-white"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update Expense" : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
