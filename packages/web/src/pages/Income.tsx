import React, { useEffect, useMemo, useState } from "react";
import TransactionChart from "../components/TransactionChart";
import { api } from "../api.ts";
import { type Frequency, FREQUENCY_LABELS, generateOccurrences, toISODateString } from "../frequency.ts";

const INCOME_CATEGORIES = ["Salary", "Investment", "Gift", "Other"];

function relativeDate(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Income() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Salary");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("none");
  const [customDate, setCustomDate] = useState(toISODateString(new Date()));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({ name: "", category: "Salary", amount: "" });
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) 
      return;
    api.get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setTransactions(r.data.transactions.filter((t: any) => t.type === "INCOME")));
  }, []);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  
  const labels = days.map((d) => d.toLocaleDateString());
  const chartData = labels.map(() => 0);
  transactions.forEach((t) => {
    const idx = labels.findIndex((l) => l === new Date(t.date).toLocaleDateString());
    if (idx >= 0) chartData[idx] += Number(t.amount);
  });

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || !token) return;
    setIsSubmitting(true);
    try {
      const startKey = frequency === "custom" ? customDate : toISODateString(new Date());
      const occurrences = generateOccurrences(startKey, frequency);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const results: any[] = [];
      for (const dateKey of occurrences) {
        const res = await api.post(
          "/api/transactions",
          { name, category, amount: Number(amount), type: "INCOME", description, date: new Date(dateKey + "T12:00:00").toISOString() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (new Date(res.data.transaction.date) <= new Date()) results.push(res.data.transaction);
      }
      setTransactions((prev) => [...results, ...prev]);
      setName(""); setAmount(""); setDescription(""); setFrequency("none");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(t: any) {
    setEditingId(t.id);
    setEditFields({ name: t.name ?? "", category: t.category ?? "Salary", amount: String(t.amount) });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    setSaveError("");
    setSaveSuccess(false);
    try {
      const res = await api.put(
        `/api/transactions/${editingId}`,
        { name: editFields.name, category: editFields.category, amount: Number(editFields.amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions((prev) => prev.map((t) => (t.id === editingId ? res.data.transaction : t)));
      setSaveSuccess(true);
      setTimeout(() => { setEditingId(null); setSaveSuccess(false); }, 800);
    } catch (err: any) {
      setSaveError(err?.response?.data?.error || "Failed to save. Please try again.");
    }
  }

  async function handleDelete(id: number) {
    setDeleteError("");
    try {
      await api.delete(`/api/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.error || "Failed to delete. Please try again.");
    }
  }

  const inputCls = "h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white";

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterCategory !== "ALL" && t.category !== filterCategory) return false;
      if (searchQuery && !t.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filterCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Income</h1>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Income</p>
            <p className="text-2xl font-bold text-emerald-500">${total.toFixed(2)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Last 7 Days</h2>
          <TransactionChart labels={labels} data={chartData} color="rgba(34,197,94,0.6)" label="Income" />
        </div>

        {/* Add Form */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Add Income</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputCls} col-span-2 sm:col-span-1`}
                required
              />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {INCOME_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)} className={inputCls}>
                {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map(f => (
                  <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                ))}
              </select>
              {frequency === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className={inputCls}
                  required
                />
              )}
              <input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputCls} ${frequency === "custom" ? "col-span-2 sm:col-span-1" : "col-span-2 sm:col-span-3"}`}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide shrink-0">Recent Income</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
              <input
                type="text"
                placeholder="Search by name…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`${inputCls} sm:w-48`}
              />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className={inputCls}
              >
                <option value="ALL">All categories</option>
                {INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {filteredTransactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">{transactions.length === 0 ? "No income recorded yet." : "No income matches your search."}</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {filteredTransactions.map((t) => (
                <li key={t.id} className="px-5 py-4">
                  {confirmDeleteId === t.id ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-gray-700">Delete <span className="font-semibold">{t.name}</span>?</p>
                      {deleteError && <p className="text-xs text-red-500 w-full">{deleteError}</p>}
                      <div className="flex gap-2 ml-auto">
                        <button onClick={() => handleDelete(t.id)} className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors">Yes, delete</button>
                        <button onClick={() => { setConfirmDeleteId(null); setDeleteError(""); }} className="h-8 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 bg-emerald-100 text-emerald-700">Income</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400">{t.category} · <span title={new Date(t.date).toLocaleDateString()}>{relativeDate(t.date)}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="font-bold text-base text-emerald-500 tabular-nums">+${Number(t.amount).toFixed(2)}</span>
                        <button onClick={() => handleEdit(t)} className="text-xs font-medium text-[#0A84FF] hover:text-blue-700 transition-colors">Edit</button>
                        <button onClick={() => { setConfirmDeleteId(t.id); setDeleteError(""); }} className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Income</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input value={editFields.name} onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))} className={`${inputCls} w-full`} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select value={editFields.category} onChange={(e) => setEditFields((f) => ({ ...f, category: e.target.value }))} className={`${inputCls} w-full`}>
                  {INCOME_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount</label>
                <input type="number" step="0.01" min="0" value={editFields.amount} onChange={(e) => setEditFields((f) => ({ ...f, amount: e.target.value }))} className={`${inputCls} w-full`} required />
              </div>
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
              {saveSuccess && <p className="text-xs text-emerald-600 font-semibold">Saved!</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" className="h-10 flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors">Save</button>
                <button type="button" onClick={() => setEditingId(null)} className="h-10 flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-lg transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
