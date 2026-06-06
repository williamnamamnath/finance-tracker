import React, { useEffect, useState } from "react";
import CategoryDonut from "../components/CategoryDonut";
import { api } from "../api.ts";
import { type Frequency, FREQUENCY_LABELS, generateOccurrences, toISODateString } from "../frequency.ts";

function relativeDate(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Dashboard() {
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [category, setCategory] = useState("Other");
  const [frequency, setFrequency] = useState<Frequency>("none");
  const [customDate, setCustomDate] = useState(toISODateString(new Date()));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({ name: "", category: "Other", amount: "", type: "EXPENSE" });
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api.get("/api/summary", { headers: { Authorization: `Bearer ${token}` } }).then(r => setSummary({ ...r.data, balance: r.data.totalIncome - r.data.totalExpense }));
    api.get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } }).then(r => setTransactions(r.data.transactions));
  }, []);

  const [chartTab, setChartTab] = useState<'expenses' | 'income' | 'all'>('expenses');

  // Build sorted list of months present in transactions
  const monthKeys = Array.from(
    new Set(transactions.map(t => new Date(t.date).toISOString().slice(0, 7)))
  ).sort().reverse(); // "YYYY-MM" descending

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Keep selectedMonth valid when transactions load
  const effectiveMonth = monthKeys.length > 0
    ? (monthKeys.includes(selectedMonth) ? selectedMonth : monthKeys[0])
    : selectedMonth;

  const filteredTransactions = transactions.filter(t =>
    new Date(t.date).toISOString().slice(0, 7) === effectiveMonth
  );

  type TxEntry = { amount: number; date: string; name: string };
  const expenseTotals: Record<string, TxEntry[]> = {};
  const incomeTotals: Record<string, TxEntry[]> = {};
  const allTotals: Record<string, TxEntry[]> = {};
  filteredTransactions.forEach(t => {
    const entry: TxEntry = { amount: Number(t.amount), date: t.date, name: t.name };
    if (t.type === 'EXPENSE') expenseTotals[t.category] = [...(expenseTotals[t.category] ?? []), entry];
    else incomeTotals[t.category] = [...(incomeTotals[t.category] ?? []), entry];
    allTotals[t.category] = [...(allTotals[t.category] ?? []), entry];
  });
  const activeCategories = chartTab === 'expenses' ? expenseTotals : chartTab === 'income' ? incomeTotals : allTotals;

  const token = localStorage.getItem("token");

  function handleEdit(t: any) {
    setEditingId(t.id);
    setEditFields({ name: t.name ?? "", category: t.category ?? "Other", amount: String(t.amount), type: t.type });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    setSaveError("");
    setSaveSuccess(false);
    try {
      const res = await api.put(
        `/api/transactions/${editingId}`,
        { name: editFields.name, category: editFields.category, amount: Number(editFields.amount), type: editFields.type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions(prev => prev.map(t => (t.id === editingId ? res.data.transaction : t)));
      setSaveSuccess(true);
      setTimeout(() => { setEditingId(null); setSaveSuccess(false); }, 800);
      const s = await api.get("/api/summary", { headers: { Authorization: `Bearer ${token}` } });
      setSummary({ ...s.data, balance: s.data.totalIncome - s.data.totalExpense });
    } catch (err: any) {
      setSaveError(err?.response?.data?.error || "Failed to save. Please try again.");
    }
  }

  async function handleDelete(id: number) {
    setDeleteError("");
    try {
      await api.delete(`/api/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(prev => prev.filter(t => t.id !== id));
      setConfirmDeleteId(null);
      const s = await api.get("/api/summary", { headers: { Authorization: `Bearer ${token}` } });
      setSummary({ ...s.data, balance: s.data.totalIncome - s.data.totalExpense });
    } catch (err: any) {
      setDeleteError(err?.response?.data?.error || "Failed to delete. Please try again.");
    }
  }

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const startKey = frequency === "custom" ? customDate : toISODateString(new Date());
    const occurrences = generateOccurrences(startKey, frequency);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const results: any[] = [];
    for (const dateKey of occurrences) {
      const res = await api.post("/api/transactions", { name, category, amount: Number(amount), type, description, date: new Date(dateKey + "T12:00:00").toISOString() }, { headers: { Authorization: `Bearer ${token}` } });
      if (new Date(res.data.transaction.date) <= new Date()) results.push(res.data.transaction);
    }
    setTransactions(prev => [...results, ...prev]);
    const s = await api.get("/api/summary", { headers: { Authorization: `Bearer ${token}` } });
    setSummary({ ...s.data, balance: s.data.totalIncome - s.data.totalExpense });
    setName(""); setAmount(""); setDescription(""); setFrequency("none");
  }

  const inputCls = "h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white";

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Balance</p>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? "text-gray-900" : "text-red-500"}`}>
              {summary.balance < 0 ? "-" : ""}${Math.abs(summary.balance).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Income</p>
            <p className="text-2xl font-bold text-emerald-500">${Number(summary.totalIncome).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-500">${Number(summary.totalExpense).toFixed(2)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Transactions by Category</h2>
            <div className="flex items-center gap-3">
              <select
                value={effectiveMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="h-8 px-2 border border-gray-200 rounded-lg text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
              >
                {(monthKeys.length > 0 ? monthKeys : [currentMonthKey]).map(mk => {
                  const [y, m] = mk.split('-');
                  const label = new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                  return <option key={mk} value={mk}>{label}</option>;
                })}
              </select>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-semibold">
                {(['expenses', 'income', 'all'] as const).map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setChartTab(tab)}
                    className={`px-3 py-1.5 transition-colors ${
                      chartTab === tab
                        ? 'bg-[#0A84FF] text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    } ${i > 0 ? 'border-l border-gray-200' : ''}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {Object.keys(activeCategories).length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data for this month.</p>
          ) : (
            <CategoryDonut categories={activeCategories} />
          )}
        </div>

        {/* Quick Add */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Add Transaction</h2>
          <form onSubmit={quickAdd} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`${inputCls} col-span-2 sm:col-span-1`}
                required
              />
              <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                <option>Groceries</option>
                <option>Rent/Mortgage</option>
                <option>Insurance</option>
                <option>Utilities</option>
                <option>Healthcare</option>
                <option>Entertainment</option>
                <option>Investment</option>
                <option>Salary</option>
                <option>Gift</option>
                <option>Other</option>
              </select>
              <input
                placeholder="Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select value={frequency} onChange={e => setFrequency(e.target.value as Frequency)} className={inputCls}>
                {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map(f => (
                  <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                ))}
              </select>
              {frequency === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className={inputCls}
                  required
                />
              )}
              <input
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`${inputCls} ${frequency === "custom" ? "col-span-2 sm:col-span-1" : "col-span-2 sm:col-span-3"}`}
              />
              <button
                type="submit"
                className="h-10 px-5 bg-[#0A84FF] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Transactions</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No transactions recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {[...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(t => (
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
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${t.type === "INCOME" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                          {t.type === "INCOME" ? "Income" : "Expense"}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400">{t.category} · <span title={new Date(t.date).toLocaleDateString()}>{relativeDate(t.date)}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className={`font-bold text-base tabular-nums ${t.type === "INCOME" ? "text-emerald-500" : "text-red-500"}`}>
                          {t.type === "INCOME" ? "+" : "-"}${Number(t.amount).toFixed(2)}
                        </span>
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Transaction</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input value={editFields.name} onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))} className={`${inputCls} w-full`} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                <select value={editFields.type} onChange={e => setEditFields(f => ({ ...f, type: e.target.value }))} className={`${inputCls} w-full`}>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select value={editFields.category} onChange={e => setEditFields(f => ({ ...f, category: e.target.value }))} className={`${inputCls} w-full`}>
                  {["Groceries","Rent/Mortgage","Insurance","Utilities","Healthcare","Entertainment","Investment","Salary","Gift","Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount</label>
                <input type="number" step="0.01" min="0" value={editFields.amount} onChange={e => setEditFields(f => ({ ...f, amount: e.target.value }))} className={`${inputCls} w-full`} required />
              </div>
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
              {saveSuccess && <p className="text-xs text-emerald-600 font-semibold">Saved!</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" className="h-10 flex-1 bg-[#0A84FF] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors">Save</button>
                <button type="button" onClick={() => setEditingId(null)} className="h-10 flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-lg transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
