import React, { useState, useMemo } from "react";
import useSWR from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

type Expense = {
  id: number;
  amount: number;
  note?: string | null;
  category: string;
  date: string;
  createdAt: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Shopping",
  "Other",
];

export default function HomePage() {
  const { data, mutate } = useSWR<Expense[]>("/api/expenses", fetcher);

  const [form, setForm] = useState({
    amount: "",
    note: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({
      amount: "",
      note: "",
      category: "Food",
      date: new Date().toISOString().slice(0, 10),
    });
    await mutate();
  }

  const chartData = useMemo(() => {
    if (!data) return [];
    const totals = new Map<string, number>();

    for (const e of data) {
      const d = e.date.slice(0, 10);
      totals.set(d, (totals.get(d) || 0) + e.amount);
    }

    return Array.from(totals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date, total }));
  }, [data]);

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <h1>Expense Tracker</h1>

      {/* Expense Form */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 8, marginBottom: 20 }}
      >
        <input
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
          required
        />
        <select
          value={form.category}
          onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
        />
        <input
          placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
        />
        <button type="submit">Add Expense</button>
      </form>

      {/* Chart */}
      <section style={{ height: 300 }}>
        <h2>Daily Totals</h2>
        {chartData.length === 0 ? (
          <p>No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), "MM-dd")}
              />
              <YAxis />
              <Tooltip labelFormatter={(l) => format(parseISO(String(l)), "PPP")} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Recent Expenses */}
      <section style={{ marginTop: 16 }}>
        <h2>Recent Expenses</h2>
        <ul>
          {data?.slice(0, 20).map((e) => (
            <li key={e.id}>
              {format(parseISO(e.date), "yyyy-MM-dd")} — {e.category} — {e.amount}{" "}
              {e.note && `(${e.note})`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
