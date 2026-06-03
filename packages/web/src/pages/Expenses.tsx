import React, { useEffect, useState } from "react";
import TransactionChart from "../components/TransactionChart";
import { api } from "../api.ts";
import { type Frequency, FREQUENCY_LABELS, generateOccurrences, toISODateString } from "../frequency.ts";

const EXPENSE_CATEGORIES = ["Groceries", "Rent/Mortgage", "Entertainment", "Utilities", "Insurance", "Healthcare", "Other"];

export default function Expenses() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("none");
  const [customDate, setCustomDate] = useState(toISODateString(new Date()));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({ name: "", category: "Groceries", amount: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) 
      return;
    api.get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setTransactions(r.data.transactions.filter((t: any) => t.type === "EXPENSE")));
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
          { name, category, amount: Number(amount), type: "EXPENSE", description, date: new Date(dateKey + "T12:00:00").toISOString() },
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
    setEditFields({ name: t.name ?? "", category: t.category ?? "Groceries", amount: String(t.amount) });
  }

  async function handleSave(e: React.FormEvent, id: number) {
    e.preventDefault();
    try {
      const res = await api.put(
        `/api/transactions/${id}`,
        { name: editFields.name, category: editFields.category, amount: Number(editFields.amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions((prev) => prev.map((t) => (t.id === id ? res.data.transaction : t)));
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

  const inputCls = "h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white";

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Expenses</p>
            <p className="text-2xl font-bold text-red-500">${total.toFixed(2)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Last 7 Days</h2>
          <TransactionChart labels={labels} data={chartData} color="rgba(239,68,68,0.6)" label="Expenses" />
        </div>

        {/* Add Form */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Add Expense</h2>
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
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
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
                className="h-10 px-5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Expenses</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No expenses recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <li key={t.id} className="px-5 py-4">
                  {editingId === t.id ? (
                    <form onSubmit={(e) => handleSave(e, t.id)} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                      <input
                        value={editFields.name}
                        onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                        className={`${inputCls} col-span-2 sm:col-span-1`}
                        required
                      />
                      <select
                        value={editFields.category}
                        onChange={(e) => setEditFields((f) => ({ ...f, category: e.target.value }))}
                        className={inputCls}
                      >
                        {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <input
                        type="number"
                        value={editFields.amount}
                        onChange={(e) => setEditFields((f) => ({ ...f, amount: e.target.value }))}
                        className={inputCls}
                        required
                      />
                      <div className="flex gap-2 col-span-2 sm:col-span-1">
                        <button type="submit" className="h-10 flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors">Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="h-10 flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-lg transition-colors">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-8 rounded-full flex-shrink-0 bg-red-400" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400">{t.category} · {new Date(t.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="font-bold text-base text-red-500">-${Number(t.amount).toFixed(2)}</span>
                        <button onClick={() => handleEdit(t)} className="text-xs font-medium text-[#0A84FF] hover:text-blue-700 transition-colors">Edit</button>
                        <button onClick={() => handleDelete(t.id)} className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
