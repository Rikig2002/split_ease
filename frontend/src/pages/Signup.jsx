import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { clearPendingInviteToken, getPendingInviteToken } from "../utils/pendingInvite";

const Signup = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handlePendingInvite = async () => {
    const pendingToken = getPendingInviteToken();

    if (!pendingToken) {
      return null;
    }

    try {
      const response = await api.post(`/invite/${pendingToken}/accept`);
      clearPendingInviteToken();
      return response.data.group;
    } catch (error) {
      clearPendingInviteToken();
      toast.error(error.response?.data?.message || "Invite could not be accepted right now");
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await api.post("/auth/register", formData);
      const { token, ...registeredUser } = response.data;

      localStorage.setItem("token", token);
      setUser(registeredUser);
      toast.success("Account created successfully");
      const joinedGroup = await handlePendingInvite();
      if (joinedGroup?._id) {
        navigate(`/groups/${joinedGroup._id}`);
        return;
      }

      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-inter px-6 py-10 relative overflow-hidden flex items-center justify-center">
      <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-teal-400/20 blur-[120px]" />

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(16,185,129,0.1)]">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent"
          >
            SplitEase
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Create account</h1>
          <p className="mt-2 text-sm text-slate-400">Start tracking expenses in a cleaner, calmer way.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-4 font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-300 hover:text-emerald-200 transition-all duration-300 ease-out">
            Login
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-slate-400">
          Got an invite link?{" "}
          <Link to="/invite" className="text-teal-300 hover:text-teal-200 transition-all duration-300 ease-out">
            Join with link
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
