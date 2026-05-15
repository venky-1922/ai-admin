/* eslint-disable react-hooks/set-state-in-effect  */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* tailwindcss-disable */
"use client";
import { useState, useEffect, useRef } from "react";

interface FormProps {
  _id?: string;
  name: string;
  age: number | string;
  height: number | string;
}

interface Message {
  role: "user" | "agent";
  text: string;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const avatarColors = [
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return avatarColors[hash % avatarColors.length];
}

export default function Home() {
  const [formData, setFormData] = useState<FormProps>({
    name: "",
    age: "",
    height: "",
  });
  const [updateData, setUpdateData] = useState<FormProps | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [usersData, setUsersData] = useState<FormProps[]>([]);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (data.users) setUsersData(data.users);
  };

   
  useEffect(() => {
    fetchUsers();
  }, [status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setUpdateData((prev) =>
      prev ? { ...prev, [e.target.name]: e.target.value } : prev
    );

  const handleQuery = async () => {
    if (!query.trim()) return;
    const userMsg = query.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setQuery("");
    setAgentLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: data.result || "No response." },
      ]);
      fetchUsers();
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          age: Number(formData.age),
          height: Number(formData.height),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: "User inserted successfully!" });
        setFormData({ name: "", age: "", height: "" });
      } else throw new Error(json.message || "Server error");
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateData?._id) return;
    setUpdateLoading(true);
    setUpdateStatus(null);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: updateData._id,
          name: updateData.name,
          age: Number(updateData.age),
          height: Number(updateData.height),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setUpdateStatus({ type: "success", msg: "Updated successfully!" });
        fetchUsers();
        setTimeout(() => setUpdateData(null), 1000);
      } else throw new Error(json.message || "Server error");
    } catch (err: any) {
      setUpdateStatus({ type: "error", msg: err.message });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setConfirmDeleteId(null);
        fetchUsers();
      }
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white font-sans">
      {/* ── TOP NAV ── */}
      <header className="sticky top-0 z-30 border-b border-white/6 bg-[#0f0f13]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
              M
            </span>
            <span className="font-semibold text-sm tracking-tight">
              UserDB{" "}
              <span className="text-white/30 font-normal">/ dashboard</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {usersData.length} records
            </span>
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 transition text-xs font-medium"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {chatOpen ? "Close chat" : "AI Agent"}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* ─── LEFT COL: INSERT FORM ─── */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
            <div className="px-6 pt-6 pb-5 border-b border-white/6">
              <p className="text-[10px] tracking-[0.15em] uppercase text-violet-400 font-mono mb-1.5">
                MongoDB · insert
              </p>
              <h2 className="text-base font-semibold text-white">
                Add new user
              </h2>
              <p className="text-xs text-white/40 mt-0.5">
                Write a new document to the collection.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {[
                {
                  label: "Full name",
                  name: "name",
                  type: "text",
                  placeholder: "e.g. Venkatesh",
                },
                {
                  label: "Age",
                  name: "age",
                  type: "number",
                  placeholder: "e.g. 22",
                },
                {
                  label: "Height (cm)",
                  name: "height",
                  type: "number",
                  placeholder: "e.g. 175",
                },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-[11px] font-medium text-white/50 mb-1.5 uppercase tracking-wide">
                    {f.label}
                  </label>
                  <input
                    required
                    type={f.type}
                    name={f.name}
                    placeholder={f.placeholder}
                    value={formData[f.name as keyof FormProps] as string}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm bg-white/4 border border-white/9 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/60 focus:border-violet-500/60 transition"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-medium rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 transition mt-1 shadow-lg shadow-violet-900/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="opacity-25"
                      />
                      <path
                        fill="currentColor"
                        className="opacity-75"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Inserting…
                  </span>
                ) : (
                  "Insert into MongoDB"
                )}
              </button>
              {status && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                    status.type === "success"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  <span>{status.type === "success" ? "✓" : "✕"}</span>{" "}
                  {status.msg}
                </div>
              )}
            </form>
          </div>

          {/* Stats card */}
          <div className="rounded-2xl border border-white/8 bg-white/3 px-6 py-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-white/30 font-mono mb-4">
              collection stats
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Total users", value: usersData.length },
                {
                  label: "Avg age",
                  value: usersData.length
                    ? Math.round(
                        usersData.reduce((s, u) => s + Number(u.age), 0) /
                          usersData.length
                      )
                    : "—",
                },
                {
                  label: "Avg height",
                  value: usersData.length
                    ? `${Math.round(
                        usersData.reduce((s, u) => s + Number(u.height), 0) /
                          usersData.length
                      )} cm`
                    : "—",
                },
                { label: "Collection", value: "users" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-semibold text-white">
                    {s.value}
                  </div>
                  <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT COL: USERS LIST ─── */}
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          <div className="px-6 pt-6 pb-5 border-b border-white/6 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-violet-400 font-mono mb-1.5">
                MongoDB · find · update · delete
              </p>
              <h2 className="text-base font-semibold text-white">All users</h2>
              <p className="text-xs text-white/40 mt-0.5">
                Manage every record in the collection.
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="p-2 rounded-lg hover:bg-white/5 transition text-white/40 hover:text-white/70"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {usersData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-white/20">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className="mb-3"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M3 5v14a9 3 0 0018 0V5" />
                  <path d="M3 12a9 3 0 0018 0" />
                </svg>
                <p className="text-sm">No users in collection</p>
              </div>
            )}
            {usersData.map((user, i) => (
              <div
                key={i}
                className="group rounded-xl border border-white/6 bg-white/2 hover:bg-white/4 transition overflow-hidden"
              >
                {/* Row */}
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full bg-linear-to-br ${getColor(
                        user.name
                      )} flex items-center justify-center text-xs font-bold shrink-0 shadow-lg`}
                    >
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-xs font-mono text-white/30 mt-0.5">
                        <span className="text-white/50">{user.age}</span> yrs
                        &nbsp;·&nbsp;{" "}
                        <span className="text-white/50">{user.height}</span> cm
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setUpdateData(
                          updateData?._id === user._id ? null : { ...user }
                        );
                        setConfirmDeleteId(null);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition font-medium ${
                        updateData?._id === user._id
                          ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                          : "border-white/10 text-white/40 hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/10"
                      }`}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDeleteId(
                          confirmDeleteId === user._id ? null : user._id!
                        );
                        setUpdateData(null);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition font-medium ${
                        confirmDeleteId === user._id
                          ? "border-red-500/50 bg-red-500/10 text-red-300"
                          : "border-white/10 text-white/40 hover:border-red-500/40 hover:text-red-300 hover:bg-red-500/10"
                      }`}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Delete confirm */}
                {confirmDeleteId === user._id && (
                  <div className="mx-4 mb-3 flex items-center justify-between bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-2.5">
                    <span className="text-xs text-red-300">
                      Delete <span className="font-medium">{user.name}</span>?
                      This can&apos;t be undone.
                    </span>
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => handleDelete(user._id!)}
                        className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg transition font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs px-3 py-1.5 border border-white/10 rounded-lg text-white/40 hover:bg-white/4 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit form */}
                {updateData?._id === user._id && (
                  <form
                    onSubmit={handleUpdate}
                    className="mx-4 mb-3 border border-violet-500/20 rounded-xl p-4 bg-violet-500/4 space-y-3"
                  >
                    <p className="text-[10px] font-mono text-violet-400 tracking-widest uppercase">
                      editing · {user.name}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Full name", name: "name", type: "text" },
                        { label: "Age", name: "age", type: "number" },
                        {
                          label: "Height (cm)",
                          name: "height",
                          type: "number",
                        },
                      ].map((f) => (
                        <div key={f.name}>
                          <label className="block text-[10px] font-medium text-white/40 mb-1 uppercase tracking-wide">
                            {f.label}
                          </label>
                          <input
                            required
                            type={f.type}
                            name={f.name}
                            value={
                              updateData
                                ? (updateData[
                                    f.name as keyof FormProps
                                  ] as string)
                                : ""
                            }
                            onChange={handleUpdateChange}
                            className="w-full px-3 py-2 text-sm bg-white/4 border border-white/9 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-violet-500/60 transition"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="px-4 py-2 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition"
                      >
                        {updateLoading ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpdateData(null)}
                        className="px-4 py-2 text-xs border border-white/10 rounded-lg text-white/40 hover:bg-white/4 transition"
                      >
                        Cancel
                      </button>
                    </div>
                    {updateStatus && (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                          updateStatus.type === "success"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        <span>
                          {updateStatus.type === "success" ? "✓" : "✕"}
                        </span>{" "}
                        {updateStatus.msg}
                      </div>
                    )}
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── AI CHAT DRAWER ── */}
      <div
        className={`fixed bottom-0 right-0 z-40 flex flex-col transition-all duration-300 ease-in-out
        ${
          chatOpen ? "w-full sm:w-100 h-120" : "w-0 h-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col h-full bg-[#13121a] border border-white/8 sm:rounded-tl-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6 bg-white/2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-white">AI Agent</div>
                <div className="text-[10px] text-white/30">
                  Connected to MongoDB
                </div>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/6 text-white/30 hover:text-white/60 transition"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-white/20 text-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className="mb-3"
                >
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <p className="text-xs">Ask the agent anything</p>
                <p className="text-[11px] mt-1 text-white/15">
                  e.g. &quot;Add user John age 25 height 180&quot;
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-violet-600 text-white rounded-br-sm"
                      : "bg-white/6 text-white/80 border border-white/[0.07] rounded-bl-sm"
                  }`}
                >
                  {m.role === "agent" && (
                    <span className="block text-[10px] text-violet-400 font-mono mb-1">
                      agent
                    </span>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
            {agentLoading && (
              <div className="flex justify-start">
                <div className="bg-white/6 border border-white/[0.07] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-white/6 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                placeholder="Ask the agent…"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                className="flex-1 px-3.5 py-2.5 text-sm bg-white/5 border border-white/9 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition"
              />
              <button
                onClick={handleQuery}
                disabled={!query.trim() || agentLoading}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 transition"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING CHAT BUTTON (when closed on mobile) ── */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-linear-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-900/50 flex items-center justify-center hover:scale-105 transition-transform sm:hidden"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
