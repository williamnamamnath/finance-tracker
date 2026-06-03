import React, { useEffect, useState } from "react";
import { api } from "../api.ts";
import { type Frequency, FREQUENCY_LABELS, generateOccurrences, toISODateString } from "../frequency.ts";

const CATEGORIES = [
  "Groceries", "Rent/Mortgage", "Insurance", "Utilities",
  "Healthcare", "Entertainment", "Investment", "Salary", "Gift", "Other",
];

function groupByDate(transactions: any[]) {
  const groups: Record<string, any[]> = {};
  for (const t of transactions) {
    const key = toISODateString(new Date(t.date));
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function formatGroupDate(dateKey: string) {
  const d = new Date(dateKey + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function daysFromNow(dateKey: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateKey + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}


export default function Upcoming() {
  const inputCls = "h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white";
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [category, setCategory] = useState("Other");
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toISODateString(tomorrow);
  });
  const [frequency, setFrequency] = useState<Frequency>("none");
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toISODateString(d);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({ name: "", category: "Other", amount: "", type: "EXPENSE", date: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = (r.data.transactions ?? []).filter(
          (t: any) => new Date(t.date) >= today
        );
        setTransactions(upcoming);
      });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startKey = frequency === "custom" ? customDate : date;
      const occurrences = generateOccurrences(startKey, frequency);

      const results: any[] = [];
      for (const dateKey of occurrences) {
        const res = await api.post(
          "/api/transactions",
          {
            name,
            category,
            amount: Number(amount),
            type,
            description,
            date: new Date(dateKey + "T12:00:00").toISOString(),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (new Date(res.data.transaction.date) >= today) {
          results.push(res.data.transaction);
        }
      }

      setTransactions((prev) => [...results, ...prev]);
      setShowForm(false);
      setName(""); setAmount(""); setDescription(""); setType("EXPENSE"); setCategory("Other"); setFrequency("none");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(toISODateString(tomorrow));
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(t: any) {
    setEditingId(t.id);
    setEditFields({
      name: t.name ?? "",
      category: t.category ?? "Other",
      amount: String(t.amount),
      type: t.type,
      date: toISODateString(new Date(t.date)),
    });
  }

  async function handleSave(e: React.FormEvent, id: number) {
    e.preventDefault();
    try {
      const res = await api.put(
        `/api/transactions/${id}`,
        {
          name: editFields.name,
          category: editFields.category,
          amount: Number(editFields.amount),
          type: editFields.type,
          date: new Date(editFields.date + "T12:00:00").toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const updated = res.data.transaction;
      if (new Date(updated.date) >= today) {
        setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      } else {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      }
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/api/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  const grouped = groupByDate(transactions);

  const totalIncoming = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalOutgoing = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0);

  const minDate = (() => {
    const today = new Date();
    return toISODateString(today);
  })();

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Upcoming Transactions</h1>
          <button
            onClick={() => { setShowForm((v) => !v); setError(""); }}
            className="h-10 px-5 bg-[#0A84FF] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {showForm ? "Cancel" : "+ Schedule"}
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Scheduled</p>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Incoming</p>
            <p className="text-2xl font-bold text-emerald-500">+${totalIncoming.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Outgoing</p>
            <p className="text-2xl font-bold text-red-500">-${totalOutgoing.toFixed(2)}</p>
          </div>
        </div>

        {/* Schedule form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Schedule Transaction</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputCls} col-span-2 sm:col-span-1`}
                  required
                />
                <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">Start date</label>
                  <input
                    type="date"
                    value={date}
                    min={minDate}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputCls}
                    required={frequency !== "custom"}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as Frequency)}
                    className={inputCls}
                  >
                    {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                      <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">Description</label>
                  <input
                    placeholder="Optional"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              {frequency === "custom" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500 font-medium">Specific date</label>
                  <input
                    type="date"
                    value={customDate}
                    min={minDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className={`${inputCls} w-full sm:w-64`}
                    required
                  />
                </div>
              )}
              {frequency !== "none" && frequency !== "custom" && (
                <p className="text-xs text-gray-400">
                  This will create{" "}
                  <span className="font-semibold text-gray-600">
                    {frequency === "daily" ? "30 daily" :
                     frequency === "weekly" ? "12 weekly" :
                     frequency === "bi-weekly" ? "12 bi-weekly" :
                     frequency === "monthly" ? "12 monthly" :
                     "3 annual"} transactions
                  </span>{" "}
                  starting {new Date(date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}.
                </p>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-5 bg-[#0A84FF] hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors self-end"
              >
                {saving ? "Saving…" : "Schedule"}
              </button>
            </form>
          </div>
        )}

        {/* Transaction list grouped by date */}
        {grouped.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-400 text-sm">No upcoming transactions scheduled.</p>
            <p className="text-gray-300 text-xs mt-1">Click "+ Schedule" to add one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map(([dateKey, txs]) => {
              const days = daysFromNow(dateKey);
              const badge =
                days === 0 ? "Today" :
                days === 1 ? "Tomorrow" :
                `In ${days} days`;
              const badgeColor =
                days === 0 ? "bg-blue-100 text-blue-600" :
                days <= 3 ? "bg-amber-100 text-amber-600" :
                "bg-gray-100 text-gray-500";

              return (
                <div key={dateKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">{formatGroupDate(dateKey)}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                  </div>
                  <ul className="divide-y divide-gray-50">
                    {txs.map((t) => (
                      <li key={t.id} className="px-5 py-4">
                        {editingId === t.id ? (
                          <form
                            onSubmit={(e) => handleSave(e, t.id)}
                            className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center"
                          >
                            <input
                              value={editFields.name}
                              onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                              className={`${inputCls} col-span-2 sm:col-span-1`}
                              required
                            />
                            <select
                              value={editFields.type}
                              onChange={(e) => setEditFields((f) => ({ ...f, type: e.target.value }))}
                              className={inputCls}
                            >
                              <option value="EXPENSE">Expense</option>
                              <option value="INCOME">Income</option>
                            </select>
                            <select
                              value={editFields.category}
                              onChange={(e) => setEditFields((f) => ({ ...f, category: e.target.value }))}
                              className={inputCls}
                            >
                              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                            <input
                              type="number"
                              value={editFields.amount}
                              onChange={(e) => setEditFields((f) => ({ ...f, amount: e.target.value }))}
                              className={inputCls}
                              required
                            />
                            <input
                              type="date"
                              value={editFields.date}
                              onChange={(e) => setEditFields((f) => ({ ...f, date: e.target.value }))}
                              className={inputCls}
                              required
                            />
                            <div className="flex gap-2 col-span-2 sm:col-span-1">
                              <button type="submit" className="h-10 flex-1 bg-[#0A84FF] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors">Save</button>
                              <button type="button" onClick={() => setEditingId(null)} className="h-10 flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-lg transition-colors">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex justify-between items-center gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-2 h-8 rounded-full flex-shrink-0 ${t.type === "INCOME" ? "bg-emerald-400" : "bg-red-400"}`} />
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                                <p className="text-xs text-gray-400">{t.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <span className={`font-bold text-base ${t.type === "INCOME" ? "text-emerald-500" : "text-red-500"}`}>
                                {t.type === "INCOME" ? "+" : "-"}${Number(t.amount).toFixed(2)}
                              </span>
                              <button onClick={() => handleEdit(t)} className="text-xs font-medium text-[#0A84FF] hover:text-blue-700 transition-colors">Edit</button>
                              <button onClick={() => handleDelete(t.id)} className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">Delete</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
