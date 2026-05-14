import React, { useEffect, useState } from "react";
import SummaryChart from "../components/SummaryChart";
import { api } from "../api.ts";

export default function Dashboard() {
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [category, setCategory] = useState("Other");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api.get("/api/summary", { headers: { Authorization: `Bearer ${token}` } }).then(r => setSummary(r.data));
    api.get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } }).then(r => setTransactions(r.data.transactions));
  }, []);

  // build last 7 days chart data
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

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await api.post("/api/transactions", { name, category, amount: Number(amount), type, description }, { headers: { Authorization: `Bearer ${token}` } });
    setTransactions(prev => [res.data.transaction, ...prev]);
    // refresh summary
    const s = await api.get("/api/summary", { headers: { Authorization: `Bearer ${token}` } });
    setSummary(s.data);
    setName(""); setAmount(""); setDescription("");
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4 text-2xl">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow w-2/3"><span className="font-bold">Total Income: </span><span className="text-green-600 font-bold">${summary.totalIncome}</span></div>
        <div className="p-4 bg-white rounded shadow w-2/3"><span className="font-bold">Total Expense: </span><span className="text-red-600 font-bold">${summary.totalExpense}</span></div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-center">Income vs Expense (7 days)</h3>
        <div className="md:w-2/3 mx-auto">
          <SummaryChart labels={labels} income={incomeData} expense={expenseData} />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Quick Add</h3>
        <form onSubmit={quickAdd} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} className="border p-2" />
            <select value={type} onChange={e=>setType(e.target.value)} className="border p-2">
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="border p-2">
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
            <input placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} className="border p-2 w-24" />
          </div>
          <div className="flex gap-2 items-center">
            <input placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} className="border p-2 w-1/2" />
            <button className="px-3 py-2 bg-blue-500 text-white rounded">Add</button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Transactions</h3>
        <ul className="space-y-2">
          {transactions.map(t => (
            <li key={t.id} className="p-3 bg-white rounded shadow flex justify-between">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-gray-500">{t.category} • {new Date(t.date).toLocaleDateString()}</div>
              </div>
              <div className={t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}><span>${t.amount}</span></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
