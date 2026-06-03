import React, { useEffect, useState } from "react";
import { api } from "../api.ts";

const CATEGORIES = [
  "Groceries", "Rent/Mortgage", "Insurance", "Utilities",
  "Healthcare", "Entertainment", "Investment", "Salary", "Gift", "Other",
];

const inputCls =
  "h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent bg-white w-full";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toLocalDateKey(isoString: string) {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Modal form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [category, setCategory] = useState("Other");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    api
      .get("/api/transactions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setTransactions(r.data.transactions ?? []));
  }, []);

  // Group transactions by local date key
  const txByDate = transactions.reduce<Record<string, any[]>>((acc, t) => {
    const key = toLocalDateKey(t.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function openModal(dateKey: string) {
    setSelectedDate(dateKey);
    setName(""); setAmount(""); setDescription(""); setType("EXPENSE"); setCategory("Other"); setError("");
  }
  function closeModal() { setSelectedDate(null); setError(""); }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedDate) return;
    setSaving(true);
    setError("");
    try {
      const res = await api.post(
        "/api/transactions",
        {
          name,
          category,
          amount: Number(amount),
          type,
          description,
          date: new Date(selectedDate + "T12:00:00").toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions(prev => [res.data.transaction, ...prev]);
      closeModal();
    } catch {
      setError("Failed to save transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayKey = toDateKey(today);

  // Build calendar grid cells (nulls = empty leading cells)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDayTxs = selectedDate ? (txByDate[selectedDate] ?? []) : [];

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h1>

        {/* Month navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              aria-label="Previous month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base font-semibold text-gray-800">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              aria-label="Next month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/50" />;
              }
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = dateKey === todayKey;
              const dayTxs = txByDate[dateKey] ?? [];
              const incomeTotal = dayTxs.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
              const expenseTotal = dayTxs.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

              return (
                <button
                  key={dateKey}
                  onClick={() => openModal(dateKey)}
                  className={`min-h-[80px] p-2 border-b border-r border-gray-100 text-left flex flex-col gap-1 transition-colors hover:bg-blue-50 focus:outline-none focus:bg-blue-50 ${
                    isToday ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-[#0A84FF] text-white" : "text-gray-700"
                    }`}
                  >
                    {day}
                  </span>
                  {incomeTotal > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-600 leading-tight">
                      +${incomeTotal.toFixed(2)}
                    </span>
                  )}
                  {expenseTotal > 0 && (
                    <span className="text-[10px] font-semibold text-red-500 leading-tight">
                      -${expenseTotal.toFixed(2)}
                    </span>
                  )}
                  {dayTxs.length > 0 && (
                    <div className="flex gap-0.5 flex-wrap mt-auto">
                      {dayTxs.slice(0, 3).map(t => (
                        <span
                          key={t.id}
                          className={`w-1.5 h-1.5 rounded-full ${t.type === "INCOME" ? "bg-emerald-400" : "bg-red-400"}`}
                        />
                      ))}
                      {dayTxs.length > 3 && (
                        <span className="text-[9px] text-gray-400 leading-none">+{dayTxs.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Add Transaction</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Existing transactions for this day */}
            {selectedDayTxs.length > 0 && (
              <div className="mb-4 rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {selectedDayTxs.map(t => (
                  <div key={t.id} className="flex justify-between items-center px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.category}</p>
                    </div>
                    <span className={`text-sm font-bold ${t.type === "INCOME" ? "text-emerald-500" : "text-red-500"}`}>
                      {t.type === "INCOME" ? "+" : "-"}${Number(t.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <input
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
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
              <input
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={inputCls}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="h-10 bg-[#0A84FF] hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {saving ? "Saving…" : "Add Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
