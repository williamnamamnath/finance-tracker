import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.ts";

const ALL_CATEGORIES = ["Groceries", "Rent/Mortgage", "Insurance", "Utilities", "Healthcare", "Entertainment", "Investment", "Salary", "Gift", "Other"];
const PAGE_SIZE = 10;

const inputCls = "h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white";

function relativeDate(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PastTransactions() {
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Edit modal
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({ name: "", category: "Other", amount: "", type: "EXPENSE" });
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(1);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setAllTransactions(r.data.transactions))
      .catch(() => setFetchError("Failed to load transactions."))
      .finally(() => setLoading(false));
  }, []);

  const filteredTransactions = useMemo(() => {
    return [...allTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(t => {
        if (filterType !== "ALL" && t.type !== filterType) return false;
        if (filterCategory !== "ALL" && t.category !== filterCategory) return false;
        if (searchQuery && !t.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
  }, [allTransactions, filterType, filterCategory, searchQuery]);

  const visibleTransactions = filteredTransactions.slice(0, page * PAGE_SIZE);
  const hasMore = visibleTransactions.length < filteredTransactions.length;

  const totals = useMemo(() => visibleTransactions.reduce(
    (acc, t) => {
      const amt = Number(t.amount);
      if (t.type === "INCOME") acc.income += amt;
      else acc.expense += amt;
      return acc;
    },
    { income: 0, expense: 0 }
  ), [visibleTransactions]);

  function handleEdit(t: any) {
    setEditingId(t.id);
    setEditFields({ name: t.name ?? "", category: t.category ?? "Other", amount: String(t.amount), type: t.type });
    setSaveError("");
    setSaveSuccess(false);
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
      setAllTransactions(prev => prev.map(t => (t.id === editingId ? res.data.transaction : t)));
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
      setAllTransactions(prev => prev.filter(t => t.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.error || "Failed to delete. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Past Transactions</h1>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by name…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className={`${inputCls} flex-1`}
          />
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className={inputCls}>
            <option value="ALL">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }} className={inputCls}>
            <option value="ALL">All categories</option>
            {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
            </h2>
          </div>

          {fetchError ? (
            <p className="text-red-400 text-sm text-center py-10">{fetchError}</p>
          ) : loading ? (
            <p className="text-gray-400 text-sm text-center py-10">Loading…</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No transactions found.</p>
          ) : (
            <>
              <ul className="divide-y divide-gray-50">
                {visibleTransactions.map(t => (
                  <li key={t.id} className="px-5 py-4">
                    {confirmDeleteId === t.id ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-700">Delete <span className="font-semibold">{t.name}</span>?</p>
                        {deleteError && <p className="text-xs text-red-500 w-full">{deleteError}</p>}
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => { setConfirmDeleteId(null); setDeleteError(""); }}
                            className="h-8 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
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
                            <p className="text-xs text-gray-400">
                              {t.category} · <span title={new Date(t.date).toLocaleDateString()}>{relativeDate(t.date)}</span>
                            </p>
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

              {/* Totals */}
              <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 text-sm items-center">
                <span className="text-gray-400">Showing {visibleTransactions.length} of {filteredTransactions.length}</span>
                <span className="ml-auto text-emerald-600 font-semibold">+${totals.income.toFixed(2)}</span>
                <span className="text-red-500 font-semibold">-${totals.expense.toFixed(2)}</span>
                <span className={`font-bold ${totals.income - totals.expense >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  Net: {totals.income - totals.expense >= 0 ? "+" : ""}${(totals.income - totals.expense).toFixed(2)}
                </span>
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="px-5 py-4 border-t border-gray-100 text-center">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-5 py-2 text-sm font-semibold text-[#0A84FF] hover:text-blue-700 transition-colors"
                  >
                    Load more ({filteredTransactions.length - visibleTransactions.length} remaining)
                  </button>
                </div>
              )}
            </>
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
                <input
                  value={editFields.name}
                  onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))}
                  className={`${inputCls} w-full`}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                <select
                  value={editFields.type}
                  onChange={e => setEditFields(f => ({ ...f, type: e.target.value }))}
                  className={`${inputCls} w-full`}
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select
                  value={editFields.category}
                  onChange={e => setEditFields(f => ({ ...f, category: e.target.value }))}
                  className={`${inputCls} w-full`}
                >
                  {ALL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFields.amount}
                  onChange={e => setEditFields(f => ({ ...f, amount: e.target.value }))}
                  className={`${inputCls} w-full`}
                  required
                />
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
