import React, { useEffect, useState } from "react";
import TransactionChart from "../components/TransactionChart";
import { api } from "../api.ts";

const EXPENSE_CATEGORIES = ["Groceries", "Rent/Mortgage", "Entertainment", "Utilities", "Insurance", "Healthcare", "Other"];

export default function Expenses() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } })
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
      const res = await api.post(
        "/api/transactions",
        { name, category, amount: Number(amount), type: "EXPENSE", description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions((prev) => [res.data.transaction, ...prev]);
      setName("");
      setAmount("");
      setDescription("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-2xl font-bold mb-2">Expenses</h2>
      <p className="text-red-600 font-semibold mb-6">Total: ${total.toFixed(2)}</p>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Expenses (last 7 days)</h3>
        <TransactionChart labels={labels} data={chartData} color="rgba(239,68,68,0.6)" label="Expenses" />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Add Expense</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2"
              required
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="border p-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border p-2 w-28"
              required
            />
          </div>
          <div className="flex gap-2 items-center">
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border p-2 w-1/2"
            />
            <button
              className="px-3 py-2 bg-red-500 text-white rounded disabled:opacity-50"
              disabled={isSubmitting}
            >
              Add
          </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Expenses</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500">No expenses recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((t) => (
              <li key={t.id} className="p-3 bg-white rounded shadow flex justify-between">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-gray-500">
                    {t.category} • {new Date(t.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-red-600 font-semibold">${Number(t.amount).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
