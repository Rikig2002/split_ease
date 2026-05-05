import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, RefreshCcw, Send } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const formatTimestamp = (value) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MESSAGE_EDIT_WINDOW_MS = 60 * 1000;

const GroupChat = ({ groupId }) => {
  const { user } = useAuth();
  const currentUserId = useMemo(() => user?._id || user?.id, [user]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [now, setNow] = useState(Date.now());
  const bottomRef = useRef(null);

  const fetchMessages = async (showSpinner = false) => {
    try {
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await api.get(`/groups/${groupId}/messages`);
      setMessages(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || "Unable to load chat messages");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!groupId) {
      return undefined;
    }

    fetchMessages(true);
    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [groupId]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 5000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported in chat");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be smaller than 5 MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        dataUrl: String(reader.result || ""),
        name: file.name,
        type: file.type,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!messageText.trim() && !attachment) {
      toast.error("Write a message or attach an image");
      return;
    }

    try {
      setSending(true);
      await api.post(`/groups/${groupId}/messages`, {
        text: messageText.trim(),
        imageDataUrl: attachment?.dataUrl || "",
        imageName: attachment?.name || "",
        imageType: attachment?.type || "",
        imageSize: attachment?.size || 0,
      });

      setMessageText("");
      setAttachment(null);
      await fetchMessages(false);
    } catch (sendError) {
      toast.error(sendError.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const canEditMessage = (message) => {
    const senderId = message.sender?._id || message.sender?.id || message.sender;
    const isMine = currentUserId && senderId?.toString() === currentUserId.toString();
    const createdAt = message.createdAt ? new Date(message.createdAt).getTime() : 0;

    return isMine && createdAt > 0 && now - createdAt < MESSAGE_EDIT_WINDOW_MS;
  };

  const getEditTimeRemaining = (message) => {
    const createdAt = message.createdAt ? new Date(message.createdAt).getTime() : 0;

    if (!createdAt) {
      return 0;
    }

    return Math.max(MESSAGE_EDIT_WINDOW_MS - (now - createdAt), 0);
  };

  const startEditing = (message) => {
    setEditingMessageId(message._id);
    setEditText(message.text || "");
  };

  const cancelEditing = () => {
    setEditingMessageId("");
    setEditText("");
  };

  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      setSavingEdit(true);
      const response = await api.patch(`/groups/${groupId}/messages/${messageId}`, {
        text: editText.trim(),
      });

      setMessages((currentMessages) =>
        currentMessages.map((message) => (message._id === messageId ? response.data : message))
      );
      cancelEditing();
      toast.success("Message updated");
    } catch (editError) {
      toast.error(editError.response?.data?.message || "Failed to edit message");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-[0_8px_32px_0_rgba(16,185,129,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Group Chat</h2>
          <p className="mt-2 text-sm text-slate-400">Messages stay inside the group and support image sharing.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchMessages(false)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-all duration-300 ease-out hover:bg-white/10 hover:text-white"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : (
        <>
          <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
            {messages.length > 0 ? (
              messages.map((message) => {
                const senderId = message.sender?._id || message.sender?.id || message.sender;
                const isMine = currentUserId && senderId?.toString() === currentUserId.toString();
                const senderName = message.sender?.name || "Unknown";
                const isEditable = canEditMessage(message);
                const isEditing = editingMessageId === message._id;
                const editTimeRemaining = getEditTimeRemaining(message);
                const remainingSeconds = Math.max(1, Math.ceil(editTimeRemaining / 1000));

                return (
                  <article
                    key={message._id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[92%] rounded-2xl border px-4 py-3 md:max-w-[80%] ${isMine ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-slate-900/70"}`}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-400">
                        <span className="font-medium text-slate-200">{isMine ? "You" : senderName}</span>
                        <span>{formatTimestamp(message.createdAt)}</span>
                      </div>
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            value={editText}
                            onChange={(event) => setEditText(event.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10"
                          />
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-400">
                              {remainingSeconds}s left to edit
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(message._id)}
                                disabled={savingEdit}
                                className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                              >
                                {savingEdit ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {message.text ? <p className="whitespace-pre-wrap text-sm leading-6 text-white">{message.text}</p> : null}
                          {message.editedAt ? <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Edited</p> : null}
                        </>
                      )}
                      {message.image?.dataUrl ? (
                        <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                          <img
                            src={message.image.dataUrl}
                            alt={message.image.name || "Chat attachment"}
                            className="max-h-80 w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : null}
                      {isMine && isEditable && !isEditing ? (
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-[11px] text-slate-400">Editable for {remainingSeconds}s</p>
                          <button
                            type="button"
                            onClick={() => startEditing(message)}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                          >
                            Edit
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
                No chat messages yet. Start the conversation.
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {attachment ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-emerald-100">Image attached</p>
                  <p className="truncate text-xs text-emerald-200/80">{attachment.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-xs text-emerald-100 transition-colors hover:text-white"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-emerald-500/20 bg-black/20">
                <img src={attachment.dataUrl} alt={attachment.name} className="max-h-52 w-full object-cover" />
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSendMessage} className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Message</label>
              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Say something to the group..."
                rows={3}
                disabled={sending}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 disabled:opacity-60"
              />
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-all duration-300 ease-out hover:bg-white/10 hover:text-white">
                <ImageIcon className="h-4 w-4" />
                Attach image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={sending} />
              </label>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
};

export default GroupChat;
