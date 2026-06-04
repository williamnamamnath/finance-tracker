import React, { useEffect, useState } from "react";
import { api } from "../api.ts";

const ALL_CATEGORIES = ["Groceries", "Rent/Mortgage", "Insurance", "Utilities", "Healthcare", "Entertainment", "Investment", "Salary", "Gift", "Other"];

const inputCls = "h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white";

export default function PastTransactions() {
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({ name: "", category: "Other", amount: "", type: "EXPENSE" });

  const token = localStorage.getItem("token");

  function getTop10(txns: any[]) {
    return [...txns]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setAllTransactions(r.data.transactions))
      .finally(() => setLoading(false));
  }, []);

  const transactions = getTop10(allTransactions);

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
      setAllTransactions(prev => prev.map(t => (t.id === id ? res.data.transaction : t)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/api/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAllTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Past Transactions</h1>

        {/* Transaction List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">10 Most Recent</h2>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-10">Loading...</p>
          ) : transactions.length === 0 ? (
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
                        {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
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
