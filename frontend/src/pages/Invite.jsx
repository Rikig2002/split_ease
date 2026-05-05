import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { storePendingInviteToken } from "../utils/pendingInvite";

const Invite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pasteValue, setPasteValue] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const accept = async () => {
      if (authLoading) {
        return;
      }

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        if (!user) {
          storePendingInviteToken(token);
          toast("Please login or sign up to accept the invite");
          navigate("/login", { replace: true });
          setLoading(false);
          return;
        }

        const res = await api.post(`/invite/${token}/accept`);
        const group = res.data.group;
        toast.success("You joined the group!");
        navigate(`/groups/${group._id}`);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to accept invite");
        setLoading(false);
      }
    };

    accept();
  }, [authLoading, navigate, token, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">Processing invite...</div>
    );
  }

  const handlePasteJoin = async () => {
    const raw = (pasteValue || "").trim();
    if (!raw) return toast.error("Paste an invite link or token");

    // Extract token (last segment) if full URL provided
    let tokenToUse = raw;
    try {
      const url = new URL(raw);
      const parts = url.pathname.split("/").filter(Boolean);
      tokenToUse = parts.pop();
    } catch (e) {
      // not a url, assume token
    }

    if (!tokenToUse) return toast.error("Could not determine invite token");

    if (!user) {
      storePendingInviteToken(tokenToUse);
      toast("Please login or sign up to accept the invite");
      navigate("/login", { replace: true });
      return;
    }

    try {
      setJoining(true);
      const res = await api.post(`/invite/${tokenToUse}/accept`);
      toast.success("You joined the group!");
      navigate(`/groups/${res.data.group._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept invite");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <p className="text-slate-300">If you have an invite link, paste it below to join the group immediately.</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-lg border border-white/10">
          <input
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder="Paste invite link or token"
            className="w-full px-3 py-2 rounded bg-white/5 text-white mb-3"
          />
          <div className="flex gap-2">
            <button onClick={handlePasteJoin} disabled={joining} className="flex-1 rounded bg-emerald-500 px-3 py-2 text-white">
              {joining ? "Joining..." : "Join with link"}
            </button>
            <button onClick={() => { setPasteValue(""); }} className="rounded bg-white/5 px-3 py-2 text-white">
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invite;
