import React from "react";
import { X } from "lucide-react";

const SelectGroupModal = ({ isOpen, onClose, groups, onGroupSelected }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Select a Group</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-2">
          {groups.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No groups available. Create one first!</p>
          ) : (
            groups.map((group) => (
              <button
                key={group._id}
                onClick={() => {
                  onGroupSelected(group._id);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-emerald-500/30 transition-all"
              >
                <p className="font-medium">{group.name}</p>
                <p className="text-sm text-slate-400">
                  {Array.isArray(group.members) ? group.members.length : 0} members
                </p>
              </button>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SelectGroupModal;
