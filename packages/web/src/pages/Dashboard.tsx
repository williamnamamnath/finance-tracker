import React, { useEffect, useState } from "react";
import SummaryChart from "../components/SummaryChart";
import { api } from "../api.ts";

export default function Dashboard() {
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [category, setCategory] = useState("Other");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({ name: "", category: "Other", amount: "", type: "EXPENSE" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api.get("/api/summary", { headers: { Authorization: `Bearer ${token}` } }).then(r => setSummary({ ...r.data, balance: r.data.totalIncome - r.data.totalExpense }));
    api.get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } }).then(r => setTransactions(r.data.transactions));
  }, []);

  const days = Array.from({length:7}).map((_,i)=>{
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const labels = days.map(d=>d.toLocaleDateString());
  const incomeData = labels.map(l=>0);
  const expenseData = labels.map(l=>0);
  transactions.forEach(t=>{
    const idx = labels.findIndex(l=> l === new Date(t.date).toLocaleDateString());
    if (idx>=0) {
      if (t.type === 'INCOME') incomeData[idx] += Number(t.amount);
      else expenseData[idx] += Number(t.amount);
    }
  });

  const token = localStorage.getItem("token");

  function handleEdit(t: any) {
    setEditingId(t.id);
    setEditFields({ name: t.name ?? "", category: t.category ?? "Other", amount: String(t.amount), type: t.type });
  }

  async function handleSave(e: React.FormEvent, id: number) {
    e.preventDefault();
    try {
      const res = await api.put(
        `/api/transactions/${id}`,
        { name: editFields.name, category: editFields.category, amount: Number(editFields.amount), type: editFields.type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions(prev => prev.map(t => (t.id === id ? res.data.transaction : t)));
      setEditingId(null);
      const s = await api.get("/api/summary", { headers: { Authorization: `Bearer ${token}` } });
      setSummary({ ...s.data, balance: s.data.totalIncome - s.data.totalExpense });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/api/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(prev => prev.filter(t => t.id !== id));
      const s = await api.get("/api/summary", { headers: { Authorization: `Bearer ${token}` } });
      setSummary({ ...s.data, balance: s.data.totalIncome - s.data.totalExpense });
    } catch (err) {
      console.error(err);
    }
  }

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const res = await api.post("/api/transactions", { name, category, amount: Number(amount), type, description }, { headers: { Authorization: `Bearer ${token}` } });
    setTransactions(prev => [res.data.transaction, ...prev]);
    const s = await api.get("/api/summary", { headers: { Authorization: `Bearer ${token}` } });
      setSummary({ ...s.data, balance: s.data.totalIncome - s.data.totalExpense });
    setName(""); setAmount(""); setDescription("");
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
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Income vs Expenses — Last 7 Days</h2>
          <SummaryChart labels={labels} income={incomeData} expense={expenseData} />
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
            <div className="flex gap-3">
              <input
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`${inputCls} flex-1`}
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
              {transactions.map(t => (
                <li key={t.id} className="px-5 py-4">
                  {editingId === t.id ? (
                    <form onSubmit={e => handleSave(e, t.id)} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                      <input
                        value={editFields.name}
                        onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))}
                        className={`${inputCls} col-span-2 sm:col-span-1`}
                        required
                      />
                      <select
                        value={editFields.type}
                        onChange={e => setEditFields(f => ({ ...f, type: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="INCOME">Income</option>
                        <option value="EXPENSE">Expense</option>
                      </select>
                      <select
                        value={editFields.category}
                        onChange={e => setEditFields(f => ({ ...f, category: e.target.value }))}
                        className={inputCls}
                      >
                        {["Groceries","Rent/Mortgage","Insurance","Utilities","Healthcare","Entertainment","Investment","Salary","Gift","Other"].map(c => <option key={c}>{c}</option>)}
                      </select>
                      <input
                        type="number"
                        value={editFields.amount}
                        onChange={e => setEditFields(f => ({ ...f, amount: e.target.value }))}
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
                          <p className="text-xs text-gray-400">{t.category} · {new Date(t.date).toLocaleDateString()}</p>
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
          )}
        </div>
      </div>
    </div>
  );
}
