/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";

interface FormProps {
  _id?: string;
  name: string;
  age: number | string;
  height: number | string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormProps>({ name: "", age: "", height: "" });
  const [updateData, setUpdateData] = useState<FormProps | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null); // ← tracks which user to delete
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [usersData, setUsersData] = useState<FormProps[]>([]);
  const [query , setQuery] = useState<string>("")
  const [agentResponse,setAgentResponse] = useState<string>("")


  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (data.users) setUsersData(data.users);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUsers(); }, [status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setUpdateData((prev) => prev ? { ...prev, [e.target.name]: e.target.value } : prev);


  const handleQuery = async()=>{
    const res = await fetch("api/chat",{
      method:"POST",
      headers : {"Content-Type":"application.json"},
      body : JSON.stringify({
        question : query
      })
    });
    const data = await res.json();
    setQuery("");
    setAgentResponse(data.result);
  }

  // ---- INSERT ----
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

  // ---- UPDATE ----
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

  // ---- DELETE ----
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (res.ok) {
        setConfirmDeleteId(null);
        fetchUsers();
      } else throw new Error(json.message);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
  <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans flex flex-col">

    {/* MAIN CONTENT */}
    <div className="flex-1 p-8 pb-36"> {/* pb-36 gives space so content doesn't hide behind chat bar */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6">

        {/* INSERT PANEL */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-7">
          <p className="text-[11px] font-mono tracking-widest uppercase text-zinc-400 mb-1">MongoDB · insert</p>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">Add user</h2>
          <p className="text-sm text-zinc-500 mb-5">Write a new record to the collection.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Full name", name: "name", type: "text", placeholder: "e.g. Venkatesh" },
              { label: "Age", name: "age", type: "number", placeholder: "e.g. 22" },
              { label: "Height (cm)", name: "height", type: "number", placeholder: "e.g. 175" },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">{f.label}</label>
                <input required type={f.type} name={f.name} placeholder={f.placeholder}
                  value={formData[f.name as keyof FormProps] as string}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                />
              </div>
            ))}
            <hr className="border-zinc-100 dark:border-zinc-800" />
            <button type="submit" disabled={loading}
              className="w-full py-2.5 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition">
              {loading ? "Inserting..." : "Insert into MongoDB"}
            </button>
            {status && (
              <p className={`text-xs text-center ${status.type === "success" ? "text-green-600" : "text-red-500"}`}>
                {status.msg}
              </p>
            )}
          </form>
        </div>

        {/* USERS PANEL */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-7">
          <p className="text-[11px] font-mono tracking-widest uppercase text-zinc-400 mb-1">MongoDB · find · update · delete</p>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">All users</h2>
          <p className="text-sm text-zinc-500 mb-5">Edit or delete any user record below.</p>
          <div className="space-y-2">
            {usersData.map((user, i) => (
              <div key={i} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-mono font-medium text-emerald-800 dark:text-emerald-200 shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name}</div>
                      <div className="text-xs font-mono text-zinc-400">age {user.age} · {user.height} cm</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => { setUpdateData(updateData?._id === user._id ? null : { ...user }); setConfirmDeleteId(null); }}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition ${
                        updateData?._id === user._id
                          ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      }`}>✎ Edit</button>
                    <button
                      onClick={() => { setConfirmDeleteId(confirmDeleteId === user._id ? null : user._id!); setUpdateData(null); }}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition ${
                        confirmDeleteId === user._id
                          ? "border-red-400 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      }`}>🗑</button>
                  </div>
                </div>
                {confirmDeleteId === user._id && (
                  <div className="mt-2 flex items-center justify-between bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                    <span className="text-xs text-red-700 dark:text-red-300">Delete {user.name}?</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(user._id!)}
                        className="text-xs px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Yes, delete</button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="text-xs px-3 py-1 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition">Cancel</button>
                    </div>
                  </div>
                )}
                {updateData?._id === user._id && (
                  <form onSubmit={handleUpdate} className="mt-3 border border-emerald-300 dark:border-emerald-700 rounded-xl p-3 bg-white dark:bg-zinc-900 space-y-3">
                    <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400">editing · {user.name}</p>
                    {[
                      { label: "Full name", name: "name", type: "text" },
                      { label: "Age", name: "age", type: "number" },
                      { label: "Height (cm)", name: "height", type: "number" },
                    ].map((f) => (
                      <div key={f.name}>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">{f.label}</label>
                        <input required type={f.type} name={f.name}
                          value={updateData ? updateData[f.name as keyof FormProps] as string : ""}
                          onChange={handleUpdateChange}
                          className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                      </div>
                    ))}
                    <button type="submit" disabled={updateLoading}
                      className="w-full py-2 text-sm font-medium bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition">
                      {updateLoading ? "Saving..." : "Save changes"}
                    </button>
                    <button type="button" onClick={() => setUpdateData(null)}
                      className="w-full py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                      Cancel
                    </button>
                    {updateStatus && (
                      <p className={`text-xs text-center ${updateStatus.type === "success" ? "text-green-600" : "text-red-500"}`}>
                        {updateStatus.msg}
                      </p>
                    )}
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>

    {/* STICKY CHAT BAR AT BOTTOM */}
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-8 py-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-3">

        {/* AGENT RESPONSE */}
        {agentResponse && (
          <div className="bg-zinc-50 dark:bg-zinc-800 border-l-2 border-emerald-400 rounded-lg px-4 py-3">
            <p className="text-[11px] font-mono text-zinc-400 mb-1">agent response</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-200">{agentResponse}</p>
          </div>
        )}

        {/* INPUT ROW */}
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={query}
            placeholder="Ask the agent anything... e.g. 'Add user John age 25'"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            className="flex-1 px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
          />
          <button
            onClick={handleQuery}
            className="px-5 py-2.5 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition whitespace-nowrap">
            Send
          </button>
        </div>

      </div>
    </div>

  </div>
);
}