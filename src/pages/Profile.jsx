import React, { useState } from "react";
import { User, Mail, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { name: nameInput.trim(), email: emailInput.trim() };
      const response = await api.patch("/auth/me", payload);
      // update context user
      setUser(response.data);
      setEditing(false);
    } catch (err) {
      // show simple alert for now
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter px-6 py-8 relative overflow-hidden">
      <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute top-40 left-0 h-80 w-80 rounded-full bg-teal-400/20 blur-[120px]" />

      <main className="relative max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white">Profile</h1>
          <p className="mt-3 text-sm text-slate-400">Manage your account settings and preferences.</p>
        </header>

        <section className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]">
          <div className="flex items-center gap-6 mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-2xl font-bold shadow-[0_0_24px_rgba(16,185,129,0.25)]">
              {getInitials(user?.name)}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{user?.name || "User"}</h2>
              <p className="mt-1 text-slate-400">{user?.email || "No email"}</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-8">
            <div className="flex items-center gap-4 rounded-lg bg-white/5 p-4">
              <User className="h-5 w-5 text-emerald-300" />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Full Name</p>
                <p className="text-white font-medium">{user?.name || "Not set"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-white/5 p-4">
              <Mail className="h-5 w-5 text-emerald-300" />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Email Address</p>
                <p className="text-white font-medium">{user?.email || "Not set"}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => {
                setNameInput(user?.name || "");
                setEmailInput(user?.email || "");
                setEditing(true);
              }}
              className="flex-1 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </section>
      </main>
      <EditModal
        open={editing}
        onClose={() => setEditing(false)}
        name={nameInput}
        email={emailInput}
        setName={setNameInput}
        setEmail={setEmailInput}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
};
// Simple edit modal
const EditModal = ({ open, onClose, name, email, setName, setEmail, onSave, saving }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Edit Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 rounded bg-white/5 text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-2 rounded bg-white/5 text-white" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded bg-white/5">Cancel</button>
          <button onClick={onSave} disabled={saving} className="flex-1 px-3 py-2 rounded bg-emerald-500 text-white">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

